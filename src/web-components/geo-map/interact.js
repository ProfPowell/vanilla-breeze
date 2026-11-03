import { getTileUrl, worldPixelToLatLng, latLngToWorldPixel } from './tile-math.js';

/**
 * MapInteraction — lazy-loaded interactive pan/zoom for <geo-map>.
 *
 * Takes over the tile layer when activated: pointer drag to pan, a click
 * (no drag) re-centres on that point (single-pointer alternative to
 * dragging, WCAG 2.5.7), two-pointer pinch to zoom, wheel / keyboard
 * zoom, and dynamic tile loading. The host renders the on-screen zoom /
 * recenter buttons and calls zoomBy() / recenter().
 *
 * World coordinates: the world is 256 * 2^zoom pixels wide. Tiles are
 * positioned relative to a tile-aligned local origin so CSS offsets stay
 * small at high zoom (layout units overflow around 33M px — zoom 17+).
 */
export class MapInteraction {
    /** @type {HTMLElement} */
    #viewport;
    /** @type {HTMLElement} */
    #tiles;
    /** @type {HTMLElement|null} */
    #marker;
    /** @type {string} */
    #provider;
    /** @type {string} */
    #tileUrl;
    /** @type {() => void} */
    #onDeactivate;
    /** @type {(detail: { lat: number, lng: number, zoom: number }) => void} */
    #onMove;
    /** @type {HTMLElement} */
    #host;

    #worldX = 0;
    #worldY = 0;
    #zoom = 15;
    #minZoom = 1;
    #maxZoom = 19;
    #originX = 0;
    #originY = 0;
    #homeLat = 0;
    #homeLng = 0;
    #homeZoom = 15;

    #width = 0;
    #height = 0;

    /** @type {Map<string, HTMLImageElement & { _wx?: number, _wy?: number }>} */
    #tileCache = new Map();

    #markerLat = 0;
    #markerLng = 0;

    /** @type {Map<number, { x: number, y: number }>} active pointers */
    #pointers = new Map();
    #dragDistance = 0;
    #pinchStart = 0;

    /**
     * @param {object} config
     * @param {HTMLElement} config.host
     * @param {HTMLElement} config.viewport - stationary focus / pointer target
     * @param {HTMLElement} config.tiles - translated tile layer
     * @param {HTMLElement|null} config.marker
     * @param {number} config.lat
     * @param {number} config.lng
     * @param {number} config.zoom
     * @param {string} config.provider - resolved provider id
     * @param {string} [config.tileUrl] - URL template overriding provider
     * @param {number} config.width
     * @param {number} config.height
     * @param {() => void} config.onDeactivate - Escape
     * @param {(detail: { lat: number, lng: number, zoom: number }) => void} [config.onMove]
     */
    constructor({ host, viewport, tiles, marker, lat, lng, zoom, provider, tileUrl, width, height, onDeactivate, onMove }) {
        this.#host = host;
        this.#viewport = viewport;
        this.#tiles = tiles;
        this.#marker = marker;
        this.#provider = provider;
        this.#tileUrl = tileUrl || '';
        this.#onDeactivate = onDeactivate;
        this.#onMove = onMove || (() => {});
        this.#zoom = zoom;
        this.#homeLat = this.#markerLat = lat;
        this.#homeLng = this.#markerLng = lng;
        this.#homeZoom = zoom;
        this.#width = width;
        this.#height = height;

        const p = latLngToWorldPixel(lat, lng, zoom);
        this.#worldX = p.x;
        this.#worldY = p.y;
        this.#resetOrigin();

        this.#tiles.replaceChildren();
        this.#tiles.style.transform = '';

        if (this.#marker) this.#tiles.appendChild(this.#marker);

        this.#viewport.addEventListener('pointerdown', this.#onPointerDown);
        this.#viewport.addEventListener('pointermove', this.#onPointerMove);
        this.#viewport.addEventListener('pointerup', this.#onPointerUp);
        this.#viewport.addEventListener('pointercancel', this.#onPointerUp);
        this.#viewport.addEventListener('wheel', this.#onWheel, { passive: false });
        this.#viewport.addEventListener('keydown', this.#onKeyDown);

        this.#updateView();
    }

    get zoom() { return this.#zoom; }
    get minZoom() { return this.#minZoom; }
    get maxZoom() { return this.#maxZoom; }

    /**
     * Current centre.
     * @returns {{ lat: number, lng: number, zoom: number }}
     */
    get center() {
        const { lat, lng } = worldPixelToLatLng(this.#worldX, this.#worldY, this.#zoom);
        return { lat: +lat.toFixed(6), lng: +lng.toFixed(6), zoom: this.#zoom };
    }

    /**
     * Zoom by whole levels around the viewport centre.
     * @param {number} delta
     */
    zoomBy(delta) {
        this.#setZoom(this.#zoom + delta, this.#width / 2, this.#height / 2);
    }

    /** Return to the original centre and zoom. */
    recenter() {
        this.#zoom = this.#homeZoom;
        const p = latLngToWorldPixel(this.#homeLat, this.#homeLng, this.#zoom);
        this.#worldX = p.x;
        this.#worldY = p.y;
        this.#clearTiles();
        this.#resetOrigin();
        this.#clampWorld();
        this.#updateView();
        this.#emitMove();
    }

    /**
     * Pan by viewport pixels.
     * @param {number} dx
     * @param {number} dy
     */
    panBy(dx, dy) {
        this.#worldX += dx;
        this.#worldY += dy;
        this.#clampWorld();
        this.#updateView();
    }

    /**
     * The host was resized: keep the centre, cover the new box.
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        if (!width || !height) return;
        if (width === this.#width && height === this.#height) return;
        this.#width = width;
        this.#height = height;
        this.#clampWorld();
        this.#updateView();
    }

    #resetOrigin() {
        this.#originX = Math.floor(this.#worldX / 256) * 256;
        this.#originY = Math.floor(this.#worldY / 256) * 256;
    }

    /** @param {PointerEvent} e */
    #onPointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (/** @type {Element} */ (e.target).closest?.('a, button')) return;
        e.preventDefault();
        this.#viewport.focus({ preventScroll: true });
        this.#pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        try { this.#viewport.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
        if (this.#pointers.size === 1) {
            this.#dragDistance = 0;
            this.#viewport.setAttribute('data-dragging', '');
        } else if (this.#pointers.size === 2) {
            this.#pinchStart = this.#pinchDistance();
            this.#dragDistance = Infinity; // a pinch is never a click
        }
    };

    /** @param {PointerEvent} e */
    #onPointerMove = (e) => {
        const prev = this.#pointers.get(e.pointerId);
        if (!prev) return;
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        prev.x = e.clientX;
        prev.y = e.clientY;

        if (this.#pointers.size === 1) {
            this.#dragDistance += Math.abs(dx) + Math.abs(dy);
            this.panBy(-dx, -dy);
            return;
        }

        if (this.#pointers.size === 2) {
            // Pan with the midpoint (half of this pointer's movement)
            this.panBy(-dx / 2, -dy / 2);
            const dist = this.#pinchDistance();
            if (!this.#pinchStart) { this.#pinchStart = dist; return; }
            const ratio = dist / this.#pinchStart;
            if (ratio >= 1.5 || ratio <= 1 / 1.5) {
                const mid = this.#pinchMidpoint();
                this.#setZoom(this.#zoom + (ratio > 1 ? 1 : -1), mid.x, mid.y);
                this.#pinchStart = dist;
            }
        }
    };

    /** @param {PointerEvent} e */
    #onPointerUp = (e) => {
        if (!this.#pointers.has(e.pointerId)) return;
        const wasSingle = this.#pointers.size === 1;
        this.#pointers.delete(e.pointerId);
        try { this.#viewport.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
        if (this.#pointers.size < 2) this.#pinchStart = 0;
        if (this.#pointers.size > 0) return;
        this.#viewport.removeAttribute('data-dragging');

        if (wasSingle && e.type === 'pointerup' && this.#dragDistance < 5) {
            // Click without drag: centre the map on the clicked point
            const rect = this.#viewport.getBoundingClientRect();
            this.panBy(e.clientX - rect.left - this.#width / 2, e.clientY - rect.top - this.#height / 2);
        }
        this.#emitMove();
    };

    #pinchDistance() {
        const [a, b] = [...this.#pointers.values()];
        return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    }

    #pinchMidpoint() {
        const [a, b] = [...this.#pointers.values()];
        const rect = this.#viewport.getBoundingClientRect();
        return { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top };
    }

    /** @param {WheelEvent} e */
    #onWheel = (e) => {
        e.preventDefault();
        // ctrlKey is set for trackpad pinch gestures
        const delta = e.ctrlKey ? -e.deltaY * 0.01 : -Math.sign(e.deltaY);
        const newZoom = Math.round(Math.max(this.#minZoom, Math.min(this.#maxZoom, this.#zoom + delta)));
        if (newZoom === this.#zoom) return;
        const rect = this.#viewport.getBoundingClientRect();
        this.#setZoom(newZoom, e.clientX - rect.left, e.clientY - rect.top);
    };

    /** @param {KeyboardEvent} e */
    #onKeyDown = (e) => {
        if (e.target !== this.#viewport) return;
        const PAN_STEP = 80;
        /** @type {[number, number] | null} */
        let pan = null;
        switch (e.key) {
            case 'ArrowLeft': pan = [-PAN_STEP, 0]; break;
            case 'ArrowRight': pan = [PAN_STEP, 0]; break;
            case 'ArrowUp': pan = [0, -PAN_STEP]; break;
            case 'ArrowDown': pan = [0, PAN_STEP]; break;
            case '+':
            case '=':
                e.preventDefault();
                this.zoomBy(1);
                return;
            case '-':
            case '_':
                e.preventDefault();
                this.zoomBy(-1);
                return;
            case 'Home':
            case '0':
                e.preventDefault();
                this.recenter();
                return;
            case 'Escape':
                e.preventDefault();
                this.#onDeactivate();
                return;
            default:
                return;
        }
        e.preventDefault();
        this.panBy(pan[0], pan[1]);
        this.#emitMove();
    };

    /**
     * Zoom toward a point in viewport coordinates.
     * @param {number} newZoom
     * @param {number} pointerX
     * @param {number} pointerY
     */
    #setZoom(newZoom, pointerX, pointerY) {
        newZoom = Math.max(this.#minZoom, Math.min(this.#maxZoom, newZoom));
        if (newZoom === this.#zoom) return;

        const worldPointerX = this.#worldX - this.#width / 2 + pointerX;
        const worldPointerY = this.#worldY - this.#height / 2 + pointerY;
        const scale = Math.pow(2, newZoom - this.#zoom);

        this.#worldX = worldPointerX * scale - pointerX + this.#width / 2;
        this.#worldY = worldPointerY * scale - pointerY + this.#height / 2;
        this.#zoom = newZoom;

        this.#clearTiles();
        this.#clampWorld();
        this.#resetOrigin();
        this.#updateView();
        this.#emitMove();
    }

    #clampWorld() {
        const worldSize = 256 * Math.pow(2, this.#zoom);
        const wrapped = ((this.#worldX % worldSize) + worldSize) % worldSize;
        if (wrapped !== this.#worldX) {
            // Crossed the antimeridian: re-anchor so cached tile positions stay valid
            this.#worldX = wrapped;
            this.#clearTiles();
            this.#resetOrigin();
        }
        const half = Math.min(this.#height / 2, worldSize / 2);
        this.#worldY = Math.max(half, Math.min(worldSize - half, this.#worldY));
    }

    #updateView() {
        const tx = -(this.#worldX - this.#width / 2 - this.#originX);
        const ty = -(this.#worldY - this.#height / 2 - this.#originY);
        this.#tiles.style.transform = `translate(${Math.round(tx)}px, ${Math.round(ty)}px)`;
        this.#loadVisibleTiles();
        this.#pruneTiles();
        this.#positionMarker();
    }

    #loadVisibleTiles() {
        const z = this.#zoom;
        const maxTile = Math.pow(2, z);
        const left = this.#worldX - this.#width / 2;
        const top = this.#worldY - this.#height / 2;
        const tileLeft = Math.floor(left / 256) - 1;
        const tileTop = Math.max(0, Math.floor(top / 256) - 1);
        const tileRight = Math.ceil((left + this.#width) / 256) + 1;
        const tileBottom = Math.min(maxTile, Math.ceil((top + this.#height) / 256) + 1);

        for (let ty = tileTop; ty < tileBottom; ty++) {
            for (let tx = tileLeft; tx < tileRight; tx++) {
                const wrappedX = ((tx % maxTile) + maxTile) % maxTile;
                const key = `${z}/${tx}/${ty}`;
                if (this.#tileCache.has(key)) continue;
                const img = /** @type {HTMLImageElement & { _wx?: number, _wy?: number }} */ (document.createElement('img'));
                img.src = getTileUrl(this.#provider, z, wrappedX, ty, this.#tileUrl);
                img.alt = '';
                img.draggable = false;
                img.style.left = `${tx * 256 - this.#originX}px`;
                img.style.top = `${ty * 256 - this.#originY}px`;
                img._wx = tx * 256;
                img._wy = ty * 256;
                this.#tileCache.set(key, img);
                this.#tiles.insertBefore(img, this.#marker?.parentNode === this.#tiles ? this.#marker : null);
            }
        }
    }

    #pruneTiles() {
        const left = this.#worldX - this.#width / 2;
        const top = this.#worldY - this.#height / 2;
        const buffer = 512;
        for (const [key, img] of this.#tileCache) {
            const x = img._wx ?? 0;
            const y = img._wy ?? 0;
            if (x + 256 < left - buffer || x > left + this.#width + buffer ||
                y + 256 < top - buffer || y > top + this.#height + buffer) {
                img.remove();
                this.#tileCache.delete(key);
            }
        }
    }

    #positionMarker() {
        if (!this.#marker) return;
        const p = latLngToWorldPixel(this.#markerLat, this.#markerLng, this.#zoom);
        const size = this.#marker.offsetWidth || 32;
        // Nearest copy of the marker to the current view (world wraps)
        const worldSize = 256 * Math.pow(2, this.#zoom);
        let x = p.x;
        while (x - this.#worldX > worldSize / 2) x -= worldSize;
        while (this.#worldX - x > worldSize / 2) x += worldSize;
        this.#marker.style.top = `${Math.round(p.y - this.#originY - size)}px`;
        this.#marker.style.left = `${Math.round(x - this.#originX - size / 2)}px`;
        this.#marker.style.transform = 'none';
    }

    #emitMove() {
        const detail = this.center;
        this.#host.dispatchEvent(new CustomEvent('geo-map:move', { bubbles: true, detail }));
        this.#onMove(detail);
    }

    #clearTiles() {
        for (const img of this.#tileCache.values()) img.remove();
        this.#tileCache.clear();
    }

    /** Tear down listeners and tiles. The host re-renders the static view. */
    destroy() {
        this.#viewport.removeEventListener('pointerdown', this.#onPointerDown);
        this.#viewport.removeEventListener('pointermove', this.#onPointerMove);
        this.#viewport.removeEventListener('pointerup', this.#onPointerUp);
        this.#viewport.removeEventListener('pointercancel', this.#onPointerUp);
        this.#viewport.removeEventListener('wheel', this.#onWheel);
        this.#viewport.removeEventListener('keydown', this.#onKeyDown);
        this.#viewport.removeAttribute('data-dragging');
        this.#pointers.clear();
        this.#clearTiles();
    }
}
