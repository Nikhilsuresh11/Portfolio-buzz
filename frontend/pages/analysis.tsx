import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Analysis(){
  const router = useRouter()
  const [ticker, setTicker] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)

  useEffect(()=>{
    const sel = localStorage.getItem('pb_selected')
    setTicker(sel)
    // For demo, load simple placeholder or fetch from backend when available
    if(sel){
      setAnalysis(`• Key insight 1 for ${sel}\n• Key insight 2 for ${sel}\n\n(Connect to news backend to generate full report)`)
    } else {
      router.push('/')
    }
  },[router])

  const download = () =>{
    if(!ticker || !analysis) return
    const blob = new Blob([`PORTFOLIO BUZZ - ANALYSIS\n\nStock: ${ticker}\n\n${analysis}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ticker}_analysis.txt`
    a.click()
  }

  return (
    <div className="container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1>Analysis — {ticker}</h1>
        <div style={{display:'flex',gap:8}}>
          <button className="button" onClick={()=>router.push('/')}>Back</button>
          <button className="button" onClick={download}>Download</button>
        </div>
      </div>

      <div style={{height:16}} />
      <div className="card">
        <pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit'}}>{analysis}</pre>
      </div>
    </div>
  )
}
