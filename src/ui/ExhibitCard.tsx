import { useMuseumStore } from '../museum/store'

export function ExhibitCard({ visible }: { visible: boolean }) {
  const card = useMuseumStore((state) => state.focus?.card ?? null)

  return (
    <aside className={`exhibit-card ${card && visible ? 'exhibit-card--visible' : ''}`}>
      {card && (
        <>
          <div className="exhibit-card__meta">
            {card.year} / {card.category}
          </div>
          <h2>{card.title}</h2>
          <p>{card.description}</p>
          <div className="exhibit-card__index">OBJECT {card.index}</div>
        </>
      )}
    </aside>
  )
}
