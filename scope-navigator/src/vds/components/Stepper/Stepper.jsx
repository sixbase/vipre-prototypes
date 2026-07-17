import { forwardRef } from 'react'
import { Check, TriangleAlert } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/index.js'

/* A step's visual state. A per-step `status` (e.g. 'error') wins; otherwise
   it's derived from position relative to the current step. */
function stepState(step, index, currentIndex) {
  if (step.status) return step.status
  if (index < currentIndex) return 'complete'
  if (index === currentIndex) return 'current'
  return 'upcoming'
}

const STATE_LABEL = {
  complete: 'Completed: ',
  error: 'Error: ',
}

/**
 * Stepper
 *
 * Progress through an ordered flow — onboarding, a wizard, a remediation
 * runbook. Pass the steps as data; point `current` at where the user is.
 *
 * Props:
 * - steps:       [{ id, label, description?, status? }] — status: 'error'
 *                overrides the derived state for that step
 * - current:     the active step — an index (number) or a step id (string)
 * - orientation: 'horizontal' | 'vertical'   (default 'horizontal')
 * - onStepClick: (step, index) => void — when given, completed (and error)
 *                steps become buttons so users can jump back
 * - all native <ol> attributes
 *
 * States: complete (check in a brand fill), current (brand fill + accent
 * ring), upcoming (muted outline), error (danger fill + warning icon).
 *
 * Responsive: horizontal steppers switch to the vertical layout automatically
 * below the `sm` breakpoint (pure CSS).
 *
 * Accessibility:
 * - An ordered list; the current step carries aria-current="step"; completed
 *   and error steps get a visually-hidden state prefix for screen readers.
 *
 * @example
 * <Stepper
 *   current={1}
 *   steps={[
 *     { id: 'scan', label: 'Scan', description: 'Find devices' },
 *     { id: 'review', label: 'Review' },
 *     { id: 'deploy', label: 'Deploy' },
 *   ]}
 *   onStepClick={(step) => goTo(step.id)}
 * />
 */
export const Stepper = forwardRef(function Stepper(
  { steps = [], current = 0, orientation = 'horizontal', onStepClick, className, ...props },
  ref,
) {
  const currentIndex =
    typeof current === 'number' ? current : steps.findIndex((s) => s.id === current)

  return (
    <ol
      ref={ref}
      className={cx('vds-stepper', `vds-stepper--${orientation}`, className)}
      {...props}
    >
      {steps.map((step, i) => {
        const state = stepState(step, i, currentIndex)
        const clickable = !!onStepClick && (state === 'complete' || state === 'error')
        const Wrapper = clickable ? 'button' : 'div'

        const indicator = (
          <span className="vds-stepper__indicator" aria-hidden="true">
            {state === 'complete' ? (
              <Icon as={Check} size="sm" />
            ) : state === 'error' ? (
              <Icon as={TriangleAlert} size="sm" />
            ) : (
              <span className="vds-stepper__number">{i + 1}</span>
            )}
          </span>
        )

        return (
          <li
            key={step.id ?? i}
            aria-current={state === 'current' ? 'step' : undefined}
            className={cx('vds-stepper__step', `vds-stepper__step--${state}`)}
          >
            <Wrapper
              className="vds-stepper__content"
              {...(clickable
                ? { type: 'button', onClick: () => onStepClick(step, i) }
                : undefined)}
            >
              {indicator}
              <span className="vds-stepper__text">
                <span className="vds-stepper__label">
                  {STATE_LABEL[state] && (
                    <span className="vds-stepper__sr">{STATE_LABEL[state]}</span>
                  )}
                  {step.label}
                </span>
                {step.description && (
                  <span className="vds-stepper__description">{step.description}</span>
                )}
              </span>
            </Wrapper>
          </li>
        )
      })}
    </ol>
  )
})

Stepper.displayName = 'Stepper'
