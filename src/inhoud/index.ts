// De inhoud wordt meegebouwd, dus hij werkt ook offline. Staat er een fout in,
// dan toont de app een foutscherm in plaats van halve vragen.
import ruweKaarten from '../../content/kaarten.json'
import ruweThemas from '../../content/themas.json'
import ruweVragen from '../../content/vragen.json'
import type { Kaart, Thema, Vraag } from '../types'
import { valideerInhoud } from './valideer'

export const inhoudFouten = valideerInhoud({
  themas: ruweThemas,
  kaarten: ruweKaarten,
  vragen: ruweVragen,
})

export const themas = ruweThemas as unknown as Thema[]
export const kaarten = ruweKaarten as unknown as Kaart[]
export const vragen = ruweVragen as unknown as Vraag[]
