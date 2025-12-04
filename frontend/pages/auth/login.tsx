import { useRouter } from 'next/router'
import { useState } from 'react'

export default function Login(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handle = (e: any) =>{
    e.preventDefault()
    // basic local auth: check stored user
    const stored = localStorage.getItem('pb_registered')
    if(!stored){ setError('No users found. Please sign up.'); return }
    const obj = JSON.parse(stored)
    if(obj.email === email && obj.password === password){
      localStorage.setItem('pb_user', email)
      router.push('/')
    } else {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="container">
      <div className="card" style={{maxWidth:480,margin:'24px auto'}}>
        <h2>Sign in</h2>
        <form onSubmit={handle} style={{display:'grid',gap:12}}>
          <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          {error && <div style={{color:'red'}}>{error}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button type="button" onClick={()=>router.push('/auth/signup')} style={{background:'transparent',border:'none',color:'#6b7280'}}>Create account</button>
            <button className="button" type="submit">Sign in</button>
          </div>
        </form>
      </div>
    </div>
  )
}
