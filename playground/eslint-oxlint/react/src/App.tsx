import { useState } from 'react'

/** A counter component; the utility classes on the elements are what the `unocss` Module orders. */
export default function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="flex flex-col items-center gap-4 p-8">
      <h1 className="text-2xl font-bold">React example</h1>
      <button
        type="button"
        className="rounded px-4 py-2 hover:bg-gray-100"
        onClick={() => setCount(count + 1)}
      >
        {`count is ${count}`}
      </button>
    </main>
  )
}
