import { getTileUrl, worldPixelToLatLng } from './tile-math.js';

/**
 * MapInteraction — lazy-loaded interactive pan/zoom for <geo-map>.
 *
 * Takes over the tile container when activated, managing pointer-based
 * panning, wheel/keyboard zoom, and dynamic tile loading.
 *
 * World coordinates: the world is 256 * 2^zoom pixels wide.
 * Panning shifts worldX/worldY. Zooming scales toward the pointer.
 */
export class MapInteraction {
    /** @type {ShadowRoot} */
    #shadow;
    /** @type {HTMLElement} */
    #host;
    /** @type {HTMLElement} */
    #tiles;
    /** @type {string} */
    #provider;
    /** @type {Function} */
    #onDeactivate;

    // Core state
    #worldX = 0;
    #worldY = 0;
    #zoom = 15;
    #minZoom = 1;
    #maxZoom = 19;

    // Viewport
    #width = 0;
    #height = 0;

    // Tile cache: "z/x/y" → HTMLImageElement
    /** @type {Map<string, HTMLImageElement>} */
    #tileCache = new Map();

    // Marker state
    /** @type {HTMLElement|null} */
    #marker = null;
    #markerWorldX = 0;
    #markerWorldY = 0;

    // Drag state
    #dragging = false;
    #lastPointerX = 0;
    #lastPointerY = 0;

    /**
     * @param {object} config
     * @param {ShadowRoot} config.shadow
     * @param {HTMLElement} config.host
     * @param {number} config.lat
     * @param {number} config.lng
     * @param {number} config.zoom
     * @param {string} config.provider
     * @param {Function} config.onDeactivate - called when user presses Escape
     */
    constructor({ shadow, host, lat, lng, zoom, provider, onDeactivate }) {
        this.#shadow = shadow;
        this.#host = host;
        this.#provider = provider;
        this.#onDeactivate = onDeactivate;
        this.#zoom = zoom;

        this.#tiles = shadow.querySelector('[part="tiles"]');
        this.#marker = shadow.querySelector('[part="marker"]');

        // Calculate initial world pixel position from lat/lng
        const worldSize = 256 * Math.pow(2, zoom);
        const latRad = (lat * Math.PI) / 180;
        this.#worldX = ((lng + 180) / 360) * worldSize;
        this.#worldY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * worldSize;

        // Store marker origin for repositioning
        this.#markerWorldX = this.#worldX;
        this.#markerWorldY = this.#worldY;

        // Read viewport size
        this.#width = this.#host.offsetWidth || 400;
        this.#height = this.#host.offsetHeight || 300;

        // Clear static tiles and switch to interactive layout
        this.#tiles.innerHTML = '';
        this.#tiles.style.transform = '';

        // Move marker into tiles container so it pans with the map
        if (this.#marker) {
            this.#marker.style.position = 'absolute';
            this.#marker.style.top = '';
            this.#marker.style.left = '';
            this.#tiles.appendChild(this.#marker);
        }

        this.#bindEvents();
        this.#updateView();
    }

    #bindEvents() {
        this.#tiles.addEventListener('pointerdown', this.#onPointerDown);
        this.#tiles.addEventListener('wheel', this.#onWheel, { passive: false });
        this.#host.addEventListener('keydown', this.#onKeyDown);
    }

    #onPointerDown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        this.#dragging = true;
        this.#lastPointerX = e.clientX;
        this.#lastPointerY = e.clientY;
        this.#tiles.setPointerCapture(e.pointerId);
        this.#tiles.setAttribute('data-dragging', '');
        this.#tiles.addEventListener('pointermove', this.#onPointerMove);
        this.#tiles.addEventListener('pointerup', this.#onPointerUp);
    };

    #onPointerMove = (e) => {
        if (!this.#dragging) return;
        const dx = e.clientX - this.#lastPointerX;
        const dy = e.clientY - this.#lastPointerY;
        this.#lastPointerX = e.clientX;
        this.#lastPointerY = e.clientY;

        this.#worldX -= dx;
        this.#worldY -= dy;
        this.#clampWorld();
        this.#updateView();
    };

    #onPointerUp = (e) => {
        this.#dragging = false;
        this.#tiles.releasePointerCapture(e.pointerId);
        this.#tiles.removeAttribute('data-dragging');
        this.#tiles.removeEventListener('pointermove', this.#onPointerMove);
        this.#tiles.removeEventListener('pointerup', this.#onPointerUp);
        this.#emitMove();
    };

    #onWheel = (e) => {
        e.preventDefault();
        // ctrlKey is set for trackpad pinch gestures
        const delta = e.ctrlKey ? -e.deltaY * 0.01 : -Math.sign(e.deltaY);
        const newZoom = Math.round(Math.max(this.#minZoom, Math.min(this.#maxZoom, this.#zoom + delta)));
        if (newZoom === this.#zoom) return;

        // Zoom toward pointer position
        const rect = this.#host.getBoundingClientRect();
        const pointerX = e.clientX - rect.left;
        const pointerY = e.clientY - rect.top;
        this.#setZoom(newZoom, pointerX, pointerY);
    };

    #onKeyDown = (e) => {
        const PAN_STEP = 80;
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.#worldX -= PAN_STEP;
                this.#clampWorld();
                this.#updateView();
                this.#emitMove();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.#worldX += PAN_STEP;
                this.#clampWorld();
                this.#updateView();
                this.#emitMove();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.#worldY -= PAN_STEP;
                this.#clampWorld();
                this.#updateView();
                this.#emitMove();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.#worldY += PAN_STEP;
                this.#clampWorld();
                this.#updateView();
                this.#emitMove();
                break;
            case '+':
            case '=':
                e.preventDefault();
                this.#setZoom(this.#zoom + 1, this.#width / 2, this.#height / 2);
                break;
            case '-':
                e.preventDefault();
                this.#setZoom(this.#zoom - 1, this.#width / 2, this.#height / 2);
                break;
            case 'Escape':
                e.preventDefault();
                this.#onDeactivate();
                break;
        }
    };

    /**
     * Zoom toward a point in viewport coordinates.
     * Scales world coordinates so the point under the pointer stays fixed.
     */
    #setZoom(newZoom, pointerX, pointerY) {
        newZoom = Math.max(this.#minZoom, Math.min(this.#maxZoom, newZoom));
        if (newZoom === this.#zoom) return;

        // World pixel position of the pointer before zoom
        const viewLeft = this.#worldX - this.#width / 2;
        const viewTop = this.#worldY - this.#height / 2;
        const worldPointerX = viewLeft + pointerX;
        const worldPointerY = viewTop + pointerY;

        // Scale factor
        const scale = Math.pow(2, newZoom - this.#zoom);

        // New world position: scale pointer's world position, then offset back
        this.#worldX = worldPointerX * scale - pointerX + this.#width / 2;
        this.#worldY = worldPointerY * scale - pointerY + this.#height / 2;

        // Scale marker origin too
        this.#markerWorldX *= scale;
        this.#markerWorldY *= scale;

        this.#zoom = newZoom;

        // Clear all tiles (they're at old zoom)
        this.#clearTiles();
        this.#clampWorld();
        this.#updateView();
        this.#emitMove();
    }

    /**
     * Clamp world coordinates to valid range for current zoom.
     */
    #clampWorld() {
        const worldSize = 256 * Math.pow(2, this.#zoom);
        // Wrap horizontally
        this.#worldX = ((this.#worldX % worldSize) + worldSize) % worldSize;
        // Clamp vertically
        this.#worldY = Math.max(this.#height / 2, Math.min(worldSize - this.#height / 2, this.#worldY));
    }

    /**
     * Update the view: position the tiles container, load visible tiles, prune off-screen, position marker.
     */
    #updateView() {
        // The viewport shows the region:
        //   left = worldX - width/2,  top = worldY - height/2
        // Tiles container origin is at world (0, 0).
        // We translate it so that worldX is at viewport center.
        const translateX = -(this.#worldX - this.#width / 2);
        const translateY = -(this.#worldY - this.#height / 2);
        this.#tiles.style.transform = `translate(${Math.round(translateX)}px, ${Math.round(translateY)}px)`;

        this.#loadVisibleTiles();
        this.#pruneTiles();
        this.#positionMarker();
    }

    /**
     * Load tiles that are visible in the current viewport.
     */
    #loadVisibleTiles() {
        const z = this.#zoom;
        const maxTile = Math.pow(2, z);

        // Viewport bounds in world pixels
        const left = this.#worldX - this.#width / 2;
        const top = this.#worldY - this.#height / 2;
        const right = left + this.#width;
        const bottom = top + this.#height;

        // Convert to tile indices with 1-tile buffer
        const tileLeft = Math.floor(left / 256) - 1;
        const tileTop = Math.max(0, Math.floor(top / 256) - 1);
        const tileRight = Math.ceil(right / 256) + 1;
        const tileBottom = Math.min(maxTile, Math.ceil(bottom / 256) + 1);

        for (let ty = tileTop; ty < tileBottom; ty++) {
            for (let tx = tileLeft; tx < tileRight; tx++) {
                // Wrap X for world wrapping
                const wrappedX = ((tx % maxTile) + maxTile) % maxTile;
                const key = `${z}/${wrappedX}/${ty}`;
                if (this.#tileCache.has(key)) continue;
                this.#loadTile(z, tx, ty, wrappedX);
            }
        }
    }

    /**
     * Create and position a tile image.
     */
    #loadTile(z, posX, posY, wrappedX) {
        const key = `${z}/${wrappedX}/${posY}`;
        if (this.#tileCache.has(key)) return;

        const pxLeft = posX * 256;
        const pxTop = posY * 256;

        const img = document.createElement('img');
        img.src = getTileUrl(this.#provider, z, wrappedX, posY);
        img.alt = '';
        img.draggable = false;
        img.style.left = pxLeft + 'px';
        img.style.top = pxTop + 'px';
        img.style.width = '256px';
        img.style.height = '256px';

        // Store world pixel positions directly (avoids CSS serialization roundtrip)
        img._wx = pxLeft;
        img._wy = pxTop;

        this.#tileCache.set(key, img);
        this.#tiles.appendChild(img);
    }

    /**
     * Remove tiles outside the viewport + 2-tile buffer.
     */
    #pruneTiles() {
        const left = this.#worldX - this.#width / 2;
        const top = this.#worldY - this.#height / 2;
        const buffer = 512; // 2 tiles

        for (const [key, img] of this.#tileCache) {
            const imgLeft = img._wx;
            const imgTop = img._wy;

            if (
                imgLeft + 256 < left - buffer ||
                imgLeft > left + this.#width + buffer ||
                imgTop + 256 < top - buffer ||
                imgTop > top + this.#height + buffer
            ) {
                img.remove();
                this.#tileCache.delete(key);
            }
        }
    }

    /**
     * Position the marker at its world coordinates within the tiles container.
     */
    #positionMarker() {
        if (!this.#marker) return;
        const markerSize = this.#marker.offsetWidth || 32;
        this.#marker.style.left = `${Math.round(this.#markerWorldX - markerSize / 2)}px`;
        this.#marker.style.top = `${Math.round(this.#markerWorldY - markerSize)}px`;
        this.#marker.style.transform = '';
    }

    /**
     * Dispatch geo-map:move with current center lat/lng/zoom.
     */
    #emitMove() {
        const { lat, lng } = worldPixelToLatLng(this.#worldX, this.#worldY, this.#zoom);
        this.#host.dispatchEvent(new CustomEvent('geo-map:move', {
            bubbles: true,
            detail: { lat: +lat.toFixed(6), lng: +lng.toFixed(6), zoom: this.#zoom }
        }));
    }

    /**
     * Clear all cached tiles from the DOM.
     */
    #clearTiles() {
        for (const img of this.#tileCache.values()) {
            img.remove();
        }
        this.#tileCache.clear();
    }

    /**
     * Tear down all listeners and state. Called on deactivation.
     */
    destroy() {
        this.#tiles.removeEventListener('pointerdown', this.#onPointerDown);
        this.#tiles.removeEventListener('wheel', this.#onWheel);
        this.#host.removeEventListener('keydown', this.#onKeyDown);
        this.#tiles.removeEventListener('pointermove', this.#onPointerMove);
        this.#tiles.removeEventListener('pointerup', this.#onPointerUp);

        // Move marker back out of tiles container
        if (this.#marker && this.#marker.parentNode === this.#tiles) {
            const container = this.#shadow.querySelector('[part="container"]');
            if (container) {
                container.insertBefore(this.#marker, this.#tiles.nextSibling);
                this.#marker.style.position = '';
                this.#marker.style.left = '';
                this.#marker.style.top = '';
                this.#marker.style.transform = '';
            }
        }

        this.#clearTiles();
        this.#host.removeAttribute('data-interactive-active');
    }
}
