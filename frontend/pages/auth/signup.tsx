import { useRouter } from 'next/router'
import { useState } from 'react'

export default function Signup(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const handle = (e: any) =>{
    e.preventDefault()
    if(password !== confirm){ setError('Passwords do not match'); return }
    if(password.length < 8){ setError('Password too short'); return }

    // store a single user locally for dev/demo
    localStorage.setItem('pb_registered', JSON.stringify({ email, password }))
    localStorage.setItem('pb_user', email)
    router.push('/')
  }

  return (
    <div className="container">
      <div className="card" style={{maxWidth:480,margin:'24px auto'}}>
        <h2>Create account</h2>
        <form onSubmit={handle} style={{display:'grid',gap:12}}>
          <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <input className="input" placeholder="Confirm password" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
          {error && <div style={{color:'red'}}>{error}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button type="button" onClick={()=>router.push('/auth/login')} style={{background:'transparent',border:'none',color:'#6b7280'}}>Sign in</button>
            <button className="button" type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}
