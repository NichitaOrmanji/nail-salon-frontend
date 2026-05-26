export default function MasterCard({ master, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(master)}
      className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
        selected
          ? 'border-pink-500 bg-pink-50'
          : 'border-gray-200 bg-white hover:border-pink-300'
      }`}
    >
      <div className="font-medium text-gray-900">{master.name}</div>
      <div className="text-sm text-gray-500 mt-1">{master.specialty}</div>
    </div>
  )
}