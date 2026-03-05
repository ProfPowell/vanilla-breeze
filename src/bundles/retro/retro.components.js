/**
 * Retro Bundle — Component Registrations
 * Vanilla Breeze · Retro / CRT
 */

import { registerComponent } from '../../lib/bundle-registry.js'
import { AudioPlayer } from './components/audio-player/audio-player.js'

registerComponent('audio-player', AudioPlayer, {
  bundle: 'retro',
  contract: 'audio-player',
  priority: 10,
})
