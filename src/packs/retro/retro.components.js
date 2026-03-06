/**
 * Retro Bundle — Component Registrations
 * Vanilla Breeze · Retro / CRT
 */

import { registerComponent } from '../../lib/bundle-registry.js'
import { RetroAudioPlayer } from './components/retro-audio-player/retro-audio-player.js'

registerComponent('retro-audio-player', RetroAudioPlayer, {
  bundle: 'retro',
  contract: 'retro-audio-player',
  priority: 10,
})
