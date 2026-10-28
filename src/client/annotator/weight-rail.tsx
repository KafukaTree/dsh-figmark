/**
 * The weight rail down the panel's left edge.
 *
 * It sizes one thing: the stroke of the mark the reader is working on, or the pen
 * of the next stroke. Idle it is a hairline, so it costs the figure nothing;
 * crossing it opens it out into a tapered track, which is where a drawing tool puts
 * its weight and where the reader's eye already looks for one.
 *
 * The track is drawn rather than styled: one path, filled twice. The second fill is
 * the same outline clipped to the height already chosen, so the blue follows the
 * wedge instead of sliding a bar next to it, and an SVG keeps the ends round where
 * a clip-path polygon cannot.
 * @module dsh-figmark/client/annotator/weight-rail
 */
import type { ReactNode } from 'react'
import { WEIGHT_MAX, WEIGHT_MIN } from '../../shared/annotation'
import type { Translate } from '../translate'
import { WEIGHT_TRACK, travelHeight } from './tokens'

/** What the weight rail reads and reports. */
export interface WeightRailProps {
  /** A private prefix for the gradient's id: two bodies may be mounted at once. */
  readonly trackId: string
  /** The weight, or the pin size, the rail is currently showing. */
  readonly value: number
  /** How far up the rail that value sits, from 0 at the lightest to 1 at the heaviest. */
  readonly fraction: number
  /** Whether the rail sizes a point mark's pin rather than a stroke. */
  readonly forPin: boolean
  /** Take a new value. */
  readonly onChange: (value: number) => void
  /** The translator seat. */
  readonly t: Translate
}

/**
 * The weight rail.
 * @param props - the value, where it sits on the track, and what it is sizing.
 * @returns the rail.
 */
export function WeightRail(props: WeightRailProps): ReactNode {
  const { t } = props
  const label = t(props.forPin ? 'pinSize' : 'weight')
  return (
    <label className="da-weight" title={label}>
      <input type="range" className="da-weight-input"
        aria-label={label}
        min={WEIGHT_MIN} max={WEIGHT_MAX} step={0.1}
        value={props.value}
        onChange={(event) => { props.onChange(Number(event.target.value)) }} />
      {/* The track is drawn, not styled: one path, filled twice. The second fill is
          the same outline clipped to the height already chosen, so the blue follows
          the wedge instead of sliding a bar next to it. An svg keeps the ends round,
          which a clip-path polygon cannot. */}
      {/* The groove is drawn, not styled: one path, so its ends stay round at any
          length, which a background on a plain div cannot promise. It carries the
          shadow and nothing else — the blue is a separate element, because the blue
          has to stop where the knob is and that is a length in the rail, not in the
          track's own coordinates. */}
      <svg className="da-weight-svg" viewBox="0 0 18 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          {/* A shadow, not a fill: the track reads as a groove pressed into the panel
              rather than a black bar laid on top of it. */}
          <linearGradient id={`${props.trackId}-shade`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="rgba(20,40,80,.06)" />
            <stop offset=".55" stopColor="rgba(20,40,80,.13)" />
            <stop offset="1" stopColor="rgba(20,40,80,.24)" />
          </linearGradient>
        </defs>
        <path d={WEIGHT_TRACK} fill={`url(#${props.trackId}-shade)`} />
      </svg>
      <span className="da-weight-fill" aria-hidden
        style={{ height: travelHeight(props.fraction) }} />
      {/* The knob's *centre* is the fill's top edge, so both are computed from one
          number and cannot drift apart. Two things follow, and both are wanted:
          the knob's box straddles the track's ends rather than being clamped inside
          it (a knob that stops short of the end it is at looks like the slider has
          further to go), and the travel is measured on the track — inset 12px from
          the rail — rather than on the rail, which is what carried the knob's box
          past the rail's rounded cap at the heaviest weight. */}
      <span className="da-weight-knob" aria-hidden
        style={{ bottom: `calc(${travelHeight(props.fraction)} - var(--da-knob-size) / 2)` }} />
    </label>
  )
}
