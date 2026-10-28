import { Badge, type BadgeTone } from './Badge'
import './SurveyRow.css'

export type Survey = {
  id: string
  emoji?: string
  image?: string
  title: string
  description: string
  badge: { label: string; tone: BadgeTone }
}

export function SurveyRow({ survey, onClick }: { survey: Survey; onClick: () => void }) {
  return (
    <button type="button" className="survey-row" onClick={onClick}>
      {survey.image ? (
        <img className="survey-row__image" src={survey.image} alt="" />
      ) : (
        <span className="survey-row__emoji" aria-hidden="true">
          {survey.emoji}
        </span>
      )}
      <span className="survey-row__body">
        <span className="survey-row__heading">
          <span className="survey-row__title">{survey.title}</span>
          <Badge tone={survey.badge.tone}>{survey.badge.label}</Badge>
        </span>
        <span className="survey-row__description">{survey.description}</span>
      </span>
    </button>
  )
}
