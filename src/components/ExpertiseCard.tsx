import './ExpertiseCard.css'

interface ExpertiseCardProps {
  title: string
  description: string
  items: string[]
}

const ExpertiseCard = ({ title, description, items }: ExpertiseCardProps) => {
  return (
    <div className="expertise-card">
      <h3>{title}</h3>
      <p>{description}</p>
      <ul className="expertise-list">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default ExpertiseCard
