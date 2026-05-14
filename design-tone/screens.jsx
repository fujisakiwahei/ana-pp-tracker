/* All screens for the ANA PP Tracker prototype */

const { useState, useMemo } = React;

// ===================== Shared bits =====================

const NAV = [
  { id: 'dashboard', label: 'DASHBOARD', href: 'dashboard' },
  { id: 'flights', label: 'FLIGHTS', href: 'flights' },
  { id: 'routes', label: 'ROUTES', href: 'routes' },
  { id: 'import', label: 'IMPORT', href: 'import' },
];

function AppHeader({ active }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span style={{display:'inline-block', width: 22, height: 4, background:'var(--ana-blue)'}}></span>
        <span className="brand-mark">PP Ledger</span>
        <span className="brand-sub">ANA Domestic · 2026</span>
      </div>
      <nav className="nav">
        {NAV.map(n => (
          <a key={n.id} className={active === n.id ? 'active' : ''}>{n.label}</a>
        ))}
      </nav>
      <div className="user-chip">
        <span>k.saito@saki-llc.com</span>
        <span className="dot">K</span>
      </div>
    </header>
  );
}

function Stars({ value }) {
  if (!value) return <span style={{color: 'var(--ink-mute)', fontSize: 11}}>—</span>;
  return (
    <span className="stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= value ? '' : 'off'}>★</span>
      ))}
    </span>
  );
}

function CabinPill({ cabin }) {
  if (cabin === 'first') return <span className="pill gold">First</span>;
  return <span className="pill economy">Economy</span>;
}

function RouteLine({ from, to, big }) {
  const fontSize = big ? 24 : 14;
  return (
    <span style={{display:'inline-flex', alignItems:'center', gap: big? 14:8, fontFamily: 'var(--font-mono)', fontSize, letterSpacing: '0.05em'}}>
      <span>{from}</span>
      <span style={{opacity:.5, fontSize: big ? 18 : 11}}>→</span>
      <span>{to}</span>
    </span>
  );
}

// ===================== DASHBOARD =====================

function DashboardScreen() {
  const total = window.TOTAL_PP;
  const goal = window.GOAL_PP;
  const pct = (total / goal) * 100;
  const remaining = goal - total;
  const flights = window.FLIGHTS.slice(0, 5);
  const suggestions = window.SUGGESTIONS.slice(0, 4);
  const A = window.AIRPORTS;

  return (
    <div className="screen">
      <AppHeader active="dashboard" />
      <div style={{padding: '36px 48px 28px', display:'flex', alignItems:'baseline', justifyContent:'space-between', borderBottom:'1px solid var(--line)'}}>
        <div>
          <div className="eyebrow">Premium point ledger · Fiscal 2026</div>
          <h1 style={{fontFamily:'var(--font-display)', fontWeight:500, fontSize:46, margin:'10px 0 0', letterSpacing:'0.005em'}}>
            おかえりなさい、Saitoさん
          </h1>
        </div>
        <button className="btn">+ フライトを記録</button>
      </div>

      <div style={{flex:1, overflow:'auto', padding:'36px 48px 48px'}}>
        {/* Hero PP block */}
        <section style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 36, marginBottom: 44}}>
          <div>
            <div className="eyebrow">YTD Premium Points</div>
            <div style={{display:'flex', alignItems:'baseline', gap: 14, marginTop: 10}}>
              <span style={{fontFamily:'var(--font-mono)', fontSize: 84, fontWeight: 300, letterSpacing:'-0.02em', lineHeight: 1, color:'var(--ink)'}}>
                {total.toLocaleString()}
              </span>
              <span style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontSize: 28, color:'var(--ink-mute)'}}>
                / {goal.toLocaleString()}
              </span>
            </div>
            <div style={{marginTop: 22}}>
              <div className="progress">
                <div className="progress-fill" style={{width: `${pct}%`}} />
              </div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:10, fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.2em', color:'var(--ink-mute)', textTransform:'uppercase'}}>
                <span>0</span>
                <span>{pct.toFixed(1)}% · Bronze 30k</span>
                <span>Platinum 50k</span>
              </div>
            </div>
            <div style={{marginTop: 28, display:'flex', gap: 48}}>
              <Metric label="目標まで残り" value={remaining.toLocaleString()} unit="PP" />
              <Metric label="今年の搭乗" value={window.FLIGHTS.length} unit="便" />
              <Metric label="達成予測" value="9月下旬" unit="このペースの場合" />
            </div>
          </div>

          {/* Editorial ticket-stub aside */}
          <aside style={{position:'relative'}}>
            <div className="card" style={{padding: '24px 26px', position:'relative', overflow:'hidden', background:'var(--ana-mist)', borderColor:'var(--ana-sky)'}}>
              <div className="eyebrow" style={{color:'var(--ana-blue)'}}>Status target</div>
              <div style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontSize: 42, fontWeight:500, lineHeight: 1.05, marginTop: 8, color:'var(--ana-blue)'}}>
                Platinum<br/><span style={{color:'var(--ink-soft)'}}>by Dec 31, 2026</span>
              </div>
              <hr className="divider" style={{margin:'20px 0', borderTopColor:'var(--ana-sky)'}}/>
              <table style={{width:'100%', fontFamily:'var(--font-mono)', fontSize: 11, letterSpacing:'0.04em'}}>
                <tbody>
                  <tr><td style={{padding:'4px 0', color:'var(--ink-soft)'}}>Bronze</td><td style={{textAlign:'right', padding:'4px 0'}}>30,000 PP</td></tr>
                  <tr><td style={{padding:'4px 0', color:'var(--ana-blue)', fontWeight: 700}}>Platinum</td><td style={{textAlign:'right', padding:'4px 0', fontWeight: 700, color:'var(--ana-blue)'}}>50,000 PP</td></tr>
                  <tr><td style={{padding:'4px 0', color:'var(--ink-mute)'}}>Diamond</td><td style={{textAlign:'right', padding:'4px 0', color:'var(--ink-mute)'}}>100,000 PP</td></tr>
                </tbody>
              </table>
              <div style={{position:'absolute', top: 20, right: -8, transform:'rotate(8deg)', fontFamily:'var(--font-mono)', fontSize: 9, letterSpacing:'0.2em', color:'var(--paper)', background:'var(--ana-blue)', padding:'3px 12px'}}>BOARDING</div>
            </div>
          </aside>
        </section>

        {/* Suggestions */}
        <section style={{marginBottom: 44}}>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 16}}>
            <div>
              <div className="eyebrow">目標まであと {remaining.toLocaleString()} PP</div>
              <h2 className="section-title">どの路線なら、あと何往復?</h2>
            </div>
            <a className="btn-link">VIEW ALL ROUTES →</a>
          </div>
          <hr className="divider-thick" />
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 0}}>
            {suggestions.map((s, i) => (
              <div key={i} style={{padding:'24px 22px 22px', borderRight: i < 3 ? '1px solid var(--line)' : 'none'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10}}>
                  <RouteLine from={s.from} to={s.to} />
                  <CabinPill cabin={s.cabin} />
                </div>
                <div style={{color:'var(--ink-mute)', fontSize:11.5, marginBottom: 14}}>
                  {window.AIRPORTS[s.from].name} ⇄ {window.AIRPORTS[s.to].name}
                </div>
                <div style={{display:'flex', alignItems:'baseline', gap: 6}}>
                  <span style={{fontFamily:'var(--font-mono)', fontSize: 54, fontWeight: 300, letterSpacing:'-0.02em', lineHeight: 1, color:'var(--ana-blue)'}}>
                    {s.roundTripsNeeded}
                  </span>
                  <span style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontSize: 22, color:'var(--ink-mute)'}}>往復</span>
                </div>
                <div style={{fontFamily:'var(--font-mono)', fontSize: 10.5, letterSpacing:'0.1em', color:'var(--ink-mute)', marginTop: 8, textTransform:'uppercase'}}>
                  {s.ppRoundTrip.toLocaleString()} PP / round-trip
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent flights */}
        <section>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 16}}>
            <div>
              <div className="eyebrow">Recent activity</div>
              <h2 className="section-title">直近のフライト</h2>
            </div>
            <a className="btn-link">FULL LOG →</a>
          </div>
          <hr className="divider-thick" />
          <table className="tbl">
            <thead>
              <tr>
                <th style={{width:120}}>Date</th>
                <th style={{width:90}}>Flight</th>
                <th>Route</th>
                <th style={{width:100}}>Cabin</th>
                <th style={{width:120}}>Aircraft</th>
                <th style={{width:120}}>Ratings</th>
                <th className="num" style={{width:120}}>PP</th>
              </tr>
            </thead>
            <tbody>
              {flights.map(f => (
                <tr key={f.id}>
                  <td className="mono">{f.flown_at}</td>
                  <td className="mono">{f.flight_number}</td>
                  <td>
                    <RouteLine from={f.from} to={f.to} />
                    <div style={{color:'var(--ink-mute)', fontSize:11, marginTop:2}}>
                      {window.AIRPORTS[f.from].name} → {window.AIRPORTS[f.to].name}
                    </div>
                  </td>
                  <td><CabinPill cabin={f.cabin}/></td>
                  <td className="mono" style={{fontSize:12}}>{f.aircraft || '—'}</td>
                  <td><Stars value={f.rating_aircraft} /></td>
                  <td className="num" style={{fontSize:15}}>{f.pp.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, unit }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div style={{display:'flex', alignItems:'baseline', gap:6, marginTop: 6}}>
        <span style={{fontFamily:'var(--font-mono)', fontSize: 26, fontWeight: 400, letterSpacing:'-0.01em'}}>{value}</span>
        <span style={{fontSize: 11, color:'var(--ink-mute)'}}>{unit}</span>
      </div>
    </div>
  );
}

// ===================== ROUTES =====================

function RoutesScreen() {
  const [hub, setHub] = useState('HND');
  const [cabin, setCabin] = useState('economy');
  const A = window.AIRPORTS;

  const routes = useMemo(() =>
    window.ROUTES.filter(r => r.from === hub || r.to === hub)
      .map(r => r.from === hub ? r : { ...r, from: r.to, to: r.from })
      .sort((a,b) => b.baseMiles - a.baseMiles),
    [hub]
  );

  const ppKey = cabin === 'first' ? 'ppFirst' : 'ppEconomy';

  return (
    <div className="screen">
      <AppHeader active="routes" />
      <div className="subheader">
        <div>
          <div className="eyebrow">Domestic route directory</div>
          <h1 className="section-title" style={{fontSize: 40}}>主要路線</h1>
        </div>
        <div style={{display:'flex', gap: 18, alignItems:'center'}}>
          <span className="eyebrow">Cabin</span>
          <div className="seg">
            <button className={cabin==='economy'?'active':''} onClick={()=>setCabin('economy')}>Economy</button>
            <button className={cabin==='first'?'active':''} onClick={()=>setCabin('first')}>First</button>
          </div>
        </div>
      </div>

      <div className="tabs" style={{padding:'0 48px'}}>
        {['HND','FUK','OKA'].map(h => (
          <button key={h} className={`tab ${hub===h?'active':''}`} onClick={()=>setHub(h)}>
            {A[h].name}
            <span className="sub">{h} · {h==='HND'?'TOKYO':h==='FUK'?'FUKUOKA':'NAHA'}</span>
          </button>
        ))}
      </div>

      <div className="page-body">
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 18}}>
          {routes.map((r, i) => (
            <article key={i} className="card" style={{padding: 20, display:'flex', flexDirection:'column', gap: 12}}>
              <header style={{display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
                <RouteLine from={r.from} to={r.to} big />
                <span className="mono" style={{fontSize:10, letterSpacing:'0.15em', color:'var(--ink-mute)'}}>×2</span>
              </header>
              <div style={{color:'var(--ink-soft)', fontSize:12.5}}>
                {A[r.from].name} ⇄ {A[r.to].name}
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 0, borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', padding:'14px 0'}}>
                <Stat label="Base mi" value={r.baseMiles.toLocaleString()} />
                <Stat label="One-way" value={r[ppKey].toLocaleString()} accent />
                <Stat label="Round-trip" value={(r[ppKey]*2).toLocaleString()} />
              </div>
              <footer style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 4}}>
                <span className={`pill ${cabin==='first'?'gold':'economy'}`}>{cabin==='first'?'First':'Economy'} 標準</span>
                <a className="btn-link">ANAで予約 →</a>
              </footer>
            </article>
          ))}
        </div>
        <p style={{marginTop: 40, fontSize: 11, color:'var(--ink-mute)', fontFamily:'var(--font-mono)', letterSpacing:'0.04em'}}>
          ※ 標準的なスタンダード運賃を前提に試算した代表値です。実際の積算PPは購入運賃によって変動します。
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap: 4, paddingRight: 8}}>
      <span className="eyebrow" style={{fontSize: 9}}>{label}</span>
      <span style={{fontFamily:'var(--font-mono)', fontSize: accent ? 22 : 16, fontWeight: accent ? 500 : 400, letterSpacing:'-0.01em', color: accent ? 'var(--ink)' : 'var(--ink-soft)'}}>
        {value}
      </span>
    </div>
  );
}

// ===================== FLIGHTS LIST =====================

function FlightsScreen() {
  const all = window.FLIGHTS;
  return (
    <div className="screen">
      <AppHeader active="flights" />
      <div className="subheader">
        <div>
          <div className="eyebrow">Flight log · 2026</div>
          <h1 className="section-title" style={{fontSize: 40}}>搭乗履歴</h1>
        </div>
        <div style={{display:'flex', alignItems:'center', gap: 16}}>
          <div className="field" style={{width: 100}}>
            <label className="field-label">Year</label>
            <select className="select"><option>2026</option><option>2025</option></select>
          </div>
          <div className="field" style={{width: 110}}>
            <label className="field-label">Cabin</label>
            <select className="select"><option>All</option><option>Economy</option><option>First</option></select>
          </div>
          <div className="field" style={{width: 110}}>
            <label className="field-label">Hub</label>
            <select className="select"><option>All</option><option>HND</option><option>FUK</option><option>OKA</option></select>
          </div>
          <button className="btn">+ 新規登録</button>
        </div>
      </div>

      <div className="page-body">
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 12}}>
          <span className="eyebrow">{all.length} flights · {window.TOTAL_PP.toLocaleString()} PP</span>
          <span className="eyebrow">Sorted by date · descending</span>
        </div>
        <hr className="divider-thick" />
        <table className="tbl">
          <thead>
            <tr>
              <th style={{width:110}}>Date</th>
              <th style={{width:80}}>Flight</th>
              <th style={{width:200}}>Route</th>
              <th style={{width:88}}>Cabin</th>
              <th style={{width:110}}>Aircraft</th>
              <th style={{width:70}}>Seat</th>
              <th>Notes</th>
              <th style={{width:140}}>Ratings</th>
              <th className="num" style={{width:90}}>PP</th>
            </tr>
          </thead>
          <tbody>
            {all.map(f => (
              <tr key={f.id}>
                <td className="mono">{f.flown_at}</td>
                <td className="mono">{f.flight_number}</td>
                <td>
                  <RouteLine from={f.from} to={f.to} />
                  <div style={{color:'var(--ink-mute)', fontSize:11, marginTop:2}}>
                    {window.AIRPORTS[f.from].name} → {window.AIRPORTS[f.to].name}
                  </div>
                </td>
                <td><CabinPill cabin={f.cabin}/></td>
                <td className="mono" style={{fontSize:12}}>{f.aircraft || '—'}</td>
                <td className="mono" style={{fontSize:12}}>{f.seat || '—'}</td>
                <td style={{fontSize: 12, color: f.notes ? 'var(--ink-soft)':'var(--ink-mute)', maxWidth: 260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                  {f.notes || <span style={{fontStyle:'italic'}}>—</span>}
                </td>
                <td>
                  <div style={{display:'flex', flexDirection:'column', gap: 2, fontSize: 10}}>
                    <span><span style={{color:'var(--ink-mute)', fontFamily:'var(--font-mono)', letterSpacing:'0.1em', marginRight:6}}>SEAT</span><Stars value={f.rating_seat}/></span>
                    <span><span style={{color:'var(--ink-mute)', fontFamily:'var(--font-mono)', letterSpacing:'0.1em', marginRight:6}}>A/C&nbsp;</span><Stars value={f.rating_aircraft}/></span>
                  </div>
                </td>
                <td className="num" style={{fontSize:15}}>{f.pp.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===================== NEW FLIGHT FORM =====================

function NewFlightScreen() {
  const [from, setFrom] = useState('HND');
  const [to, setTo] = useState('OKA');
  const [cabin, setCabin] = useState('economy');
  const route = window.findRoute(from, to);
  const pp = route ? (cabin === 'first' ? route.ppFirst : route.ppEconomy) : 0;
  const A = window.AIRPORTS;

  return (
    <div className="screen">
      <AppHeader active="flights" />
      <div className="subheader">
        <div>
          <div className="eyebrow">Log a flight · New entry</div>
          <h1 className="section-title" style={{fontSize: 40}}>フライトを記録</h1>
        </div>
        <a className="btn-link">← FLIGHT LOG</a>
      </div>

      <div className="page-body" style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 56}}>
        {/* Form column */}
        <form style={{display:'flex', flexDirection:'column', gap: 28}}>
          <fieldset style={{border:'none', padding:0, margin:0}}>
            <legend className="eyebrow" style={{marginBottom: 14}}>Itinerary</legend>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 24}}>
              <div className="field">
                <label className="field-label">搭乗日</label>
                <input className="input mono" type="text" defaultValue="2026-05-14" />
              </div>
              <div className="field">
                <label className="field-label">便名</label>
                <input className="input mono" placeholder="NH256" />
              </div>
              <div className="field">
                <label className="field-label">運賃種別</label>
                <select className="select" defaultValue="standard">
                  <option value="standard">スタンダード</option>
                  <option value="flex">フレックス</option>
                  <option value="simple">シンプル</option>
                  <option value="sale">セール</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset style={{border:'none', padding:0, margin:0}}>
            <legend className="eyebrow" style={{marginBottom: 14}}>Route</legend>
            <div style={{display:'grid', gridTemplateColumns:'1fr 24px 1fr', gap: 18, alignItems:'end'}}>
              <div className="field">
                <label className="field-label">出発</label>
                <select className="select" value={from} onChange={e=>setFrom(e.target.value)}>
                  {Object.keys(A).map(k => <option key={k} value={k}>{k} · {A[k].name}</option>)}
                </select>
              </div>
              <span style={{paddingBottom: 12, textAlign:'center', color:'var(--ink-mute)'}}>→</span>
              <div className="field">
                <label className="field-label">到着</label>
                <select className="select" value={to} onChange={e=>setTo(e.target.value)}>
                  {Object.keys(A).map(k => <option key={k} value={k}>{k} · {A[k].name}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginTop: 22}}>
              <label className="field-label">クラス</label>
              <div className="seg" style={{marginTop: 8}}>
                <button type="button" className={cabin==='economy'?'active':''} onClick={()=>setCabin('economy')}>Economy</button>
                <button type="button" className={cabin==='first'?'active':''} onClick={()=>setCabin('first')}>First</button>
              </div>
            </div>
          </fieldset>

          <fieldset style={{border:'none', padding:0, margin:0}}>
            <legend className="eyebrow" style={{marginBottom: 14}}>Aircraft & seat</legend>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 24}}>
              <div className="field">
                <label className="field-label">機体</label>
                <input className="input" placeholder="B787-9" />
              </div>
              <div className="field">
                <label className="field-label">座席</label>
                <input className="input mono" placeholder="1A" />
              </div>
              <div className="field">
                <label className="field-label">ラウンジ</label>
                <input className="input" placeholder="ANA LOUNGE 羽田" />
              </div>
            </div>
          </fieldset>

          <fieldset style={{border:'none', padding:0, margin:0}}>
            <legend className="eyebrow" style={{marginBottom: 14}}>Review</legend>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 24, marginBottom: 22}}>
              <RatingPicker label="座席" value={4}/>
              <RatingPicker label="機体" value={5}/>
              <RatingPicker label="ラウンジ" value={4}/>
            </div>
            <div className="field">
              <label className="field-label">メモ</label>
              <textarea className="textarea" placeholder="搭乗の振り返り、機内サービスの感想など"></textarea>
            </div>
          </fieldset>

          <div style={{display:'flex', gap: 12, paddingTop: 12, borderTop:'1px solid var(--line)'}}>
            <button type="submit" className="btn">記録する</button>
            <button type="button" className="btn btn-ghost">キャンセル</button>
          </div>
        </form>

        {/* Live PP preview */}
        <aside style={{position:'sticky', top: 0, height:'fit-content'}}>
          <div className="card" style={{padding: '26px 26px 28px'}}>
            <div className="eyebrow">Auto-calculated</div>
            <div style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontSize: 22, marginTop: 6, color:'var(--ink-soft)'}}>
              今回の搭乗で加算されるPP
            </div>
            <div style={{marginTop: 18, display:'flex', alignItems:'baseline', gap: 8}}>
              <span style={{fontFamily:'var(--font-mono)', fontSize: 64, fontWeight: 300, letterSpacing:'-0.02em', lineHeight: 1}}>
                {pp.toLocaleString()}
              </span>
              <span style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontSize: 20, color:'var(--ink-mute)'}}>PP</span>
            </div>
            <hr className="divider" style={{margin:'22px 0'}}/>
            <table style={{width:'100%', fontFamily:'var(--font-mono)', fontSize: 11.5, letterSpacing:'0.04em'}}>
              <tbody>
                <tr><td style={{padding:'5px 0', color:'var(--ink-mute)'}}>区間</td><td style={{textAlign:'right', padding:'5px 0'}}>{from} → {to}</td></tr>
                <tr><td style={{padding:'5px 0', color:'var(--ink-mute)'}}>基本マイル</td><td style={{textAlign:'right', padding:'5px 0'}}>{route?.baseMiles.toLocaleString() || '—'}</td></tr>
                <tr><td style={{padding:'5px 0', color:'var(--ink-mute)'}}>積算率</td><td style={{textAlign:'right', padding:'5px 0'}}>{cabin==='first'?'130%':'80%'}</td></tr>
                <tr><td style={{padding:'5px 0', color:'var(--ink-mute)'}}>路線倍率</td><td style={{textAlign:'right', padding:'5px 0'}}>×2</td></tr>
                <tr><td style={{padding:'5px 0', color:'var(--ink-mute)'}}>搭乗ポイント</td><td style={{textAlign:'right', padding:'5px 0'}}>+{cabin==='first'?400:200}</td></tr>
              </tbody>
            </table>
            <p style={{marginTop: 16, fontSize: 10.5, color:'var(--ink-mute)', lineHeight: 1.6}}>
              スタンダード運賃を前提に試算しています。実績と差がある場合は、下の欄に実際のPPを入力して上書きできます。
            </p>
            <div className="field" style={{marginTop: 18}}>
              <label className="field-label">PP(手入力で上書き)</label>
              <input className="input mono" placeholder={pp.toString()} />
            </div>
          </div>

          <div style={{marginTop: 18, padding: '18px 22px', border:'1px dashed var(--line)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div>
              <div className="eyebrow">記録後の累計</div>
              <div style={{fontFamily:'var(--font-mono)', fontSize: 18, marginTop: 4}}>
                {(window.TOTAL_PP + pp).toLocaleString()} / 50,000
              </div>
            </div>
            <div className="mono" style={{fontSize:11, color:'var(--ink-mute)', letterSpacing:'0.05em'}}>
              +{((pp/(window.GOAL_PP))*100).toFixed(1)}%
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RatingPicker({ label, value }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div style={{display:'flex', gap: 6, paddingTop: 8, fontSize: 22, color:'var(--ink)'}}>
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{color: i <= value ? 'var(--ink)' : 'var(--line)'}}>★</span>
        ))}
      </div>
    </div>
  );
}

// ===================== IMPORT =====================

function ImportScreen() {
  const sample = [
    { flown_at:'2026-04-10', flight_number:'NH256', from:'HND', to:'FUK', cabin:'economy', pp:'(auto)', status:'ok' },
    { flown_at:'2026-04-12', flight_number:'NH257', from:'FUK', to:'HND', cabin:'first', pp:'(auto)', status:'ok' },
    { flown_at:'2026-05-03', flight_number:'NH463', from:'HND', to:'OKA', cabin:'economy', pp:'(auto)', status:'ok' },
    { flown_at:'2026-05-05', flight_number:'NH468', from:'OKA', to:'HND', cabin:'economy', pp:'(auto)', status:'ok' },
    { flown_at:'2026-05-08', flight_number:'NH471', from:'HND', to:'HXX', cabin:'economy', pp:'(auto)', status:'err', issue:'Invalid airport code: HXX' },
    { flown_at:'2026-05-10', flight_number:'NH018', from:'HND', to:'ITM', cabin:'business', pp:'(auto)', status:'err', issue:'Cabin must be economy or first' },
  ];
  return (
    <div className="screen">
      <AppHeader active="import" />
      <div className="subheader">
        <div>
          <div className="eyebrow">Bulk import · CSV</div>
          <h1 className="section-title" style={{fontSize: 40}}>CSVインポート</h1>
        </div>
        <a className="btn-link">↓ サンプルCSVをダウンロード</a>
      </div>

      <div className="page-body">
        {/* Drop zone */}
        <div style={{border:'1.5px dashed var(--ink)', padding: '48px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--paper-soft)'}}>
          <div>
            <div className="eyebrow">Drop file · or click to select</div>
            <div style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontSize: 30, marginTop: 8}}>
              flight-log-2026-q2.csv
            </div>
            <div style={{fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--ink-mute)', marginTop: 6, letterSpacing:'0.05em'}}>
              6 rows · 1.2 KB · UTF-8 · loaded 14:23
            </div>
          </div>
          <button className="btn btn-ghost">別のファイルを選択</button>
        </div>

        {/* Status strip */}
        <div style={{display:'flex', gap: 0, marginTop: 24, border:'1px solid var(--line)', background:'var(--card)'}}>
          <StatusCell label="Total rows" value="6" />
          <StatusCell label="Valid" value="4" color="var(--ok)" />
          <StatusCell label="Errors" value="2" color="var(--alert)" />
          <StatusCell label="Will add to PP" value="+6,818" />
        </div>

        {/* Preview table */}
        <div style={{marginTop: 32}}>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 12}}>
            <span className="eyebrow">Preview · 6 rows</span>
            <span style={{fontSize: 11, color:'var(--alert)', fontFamily:'var(--font-mono)', letterSpacing:'0.05em'}}>
              2件のエラーを修正してください
            </span>
          </div>
          <hr className="divider-thick"/>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{width:30}}>#</th>
                <th>Date</th>
                <th>Flight</th>
                <th>From</th>
                <th>To</th>
                <th>Cabin</th>
                <th>PP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sample.map((r, i) => (
                <tr key={i} style={r.status==='err' ? {background:'color-mix(in srgb, var(--alert) 6%, transparent)'} : {}}>
                  <td className="mono" style={{color:'var(--ink-mute)'}}>{i+1}</td>
                  <td className="mono">{r.flown_at}</td>
                  <td className="mono">{r.flight_number}</td>
                  <td className="mono">{r.from}</td>
                  <td className="mono" style={r.status==='err'&&r.from==='HND'&&r.to==='HXX' ? {color:'var(--alert)', fontWeight:600}:{}}>{r.to}</td>
                  <td className="mono" style={r.cabin==='business' ? {color:'var(--alert)', fontWeight:600}:{}}>{r.cabin}</td>
                  <td className="mono" style={{color:'var(--ink-mute)'}}>{r.pp}</td>
                  <td>
                    {r.status==='ok'
                      ? <span style={{color:'var(--ok)', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.2em'}}>● OK</span>
                      : <span style={{color:'var(--alert)', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.05em'}}>● {r.issue}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{marginTop: 28, display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop: 18, borderTop:'1px solid var(--line)'}}>
          <p style={{fontSize: 11.5, color:'var(--ink-mute)', maxWidth: 520, lineHeight: 1.55}}>
            1件でもエラーがあるとインポートは行われません。ファイルを修正してから、もう一度アップロードしてください。
          </p>
          <div style={{display:'flex', gap: 12}}>
            <button className="btn btn-ghost">キャンセル</button>
            <button className="btn" disabled style={{opacity:.4, cursor:'not-allowed'}}>4件をインポート</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCell({ label, value, color }) {
  return (
    <div style={{flex:1, padding:'18px 22px', borderRight:'1px solid var(--line)'}}>
      <div className="eyebrow">{label}</div>
      <div style={{fontFamily:'var(--font-mono)', fontSize: 26, fontWeight: 400, marginTop: 4, color: color || 'var(--ink)'}}>
        {value}
      </div>
    </div>
  );
}

// ===================== LOGIN =====================

function LoginScreen() {
  return (
    <div className="screen" style={{background:'var(--paper)'}}>
      <div style={{flex:1, display:'grid', gridTemplateColumns:'1.1fr 1fr'}}>
        {/* Left editorial panel */}
        <div style={{padding:'56px 64px', display:'flex', flexDirection:'column', justifyContent:'space-between', background:'var(--ink)', color:'var(--paper)'}}>
          <div>
            <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:'color-mix(in srgb, var(--paper) 60%, transparent)'}}>
              Premium Point Ledger
            </div>
            <div style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontWeight:500, fontSize:68, lineHeight:1.02, marginTop:18, letterSpacing:'0.005em'}}>
              静かに、<br/>確かに、<br/>積み上げる。
            </div>
            <p style={{maxWidth: 360, marginTop: 28, fontSize: 13.5, color:'color-mix(in srgb, var(--paper) 78%, transparent)', lineHeight: 1.7}}>
              ANA国内線のプレミアムポイントを記録して、福岡・那覇・羽田を起点に「あと何往復で届くか」を一目で確認できる、個人用の搭乗台帳です。
            </p>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
            <div style={{fontFamily:'var(--font-mono)', fontSize: 10, letterSpacing:'0.2em', color:'color-mix(in srgb, var(--paper) 50%, transparent)'}}>
              FY2026 · v0.1
            </div>
            <div style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontSize: 16, color:'var(--gold)'}}>
              50,000 PP → Platinum
            </div>
          </div>
        </div>
        {/* Right form */}
        <div style={{padding:'56px 72px', display:'flex', flexDirection:'column', justifyContent:'center'}}>
          <div className="eyebrow">Sign in</div>
          <h1 style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontWeight:500, fontSize: 46, margin:'10px 0 28px'}}>
            おかえりなさい
          </h1>
          <form style={{display:'flex', flexDirection:'column', gap: 22, maxWidth: 360}}>
            <div className="field">
              <label className="field-label">メールアドレス</label>
              <input className="input" placeholder="you@example.com" />
            </div>
            <div className="field">
              <label className="field-label">パスワード</label>
              <input className="input" type="password" placeholder="•••••••••" />
            </div>
            <button className="btn" style={{justifyContent:'center', width:'100%', padding:'14px'}}>サインイン</button>
          </form>
          <div style={{display:'flex', alignItems:'center', gap: 14, maxWidth: 360, margin:'28px 0'}}>
            <hr className="divider" style={{flex:1}}/>
            <span className="eyebrow">or</span>
            <hr className="divider" style={{flex:1}}/>
          </div>
          <button className="btn btn-ghost" style={{maxWidth: 360, justifyContent:'center', padding:'14px'}}>
            <span style={{width:14, height:14, display:'inline-block', borderRadius:'50%', background:'conic-gradient(from 0deg, oklch(0.55 0.18 25) 0 25%, oklch(0.7 0.16 90) 25% 50%, oklch(0.55 0.17 145) 50% 75%, oklch(0.55 0.16 250) 75% 100%)'}}></span>
            Google で続ける
          </button>
          <button className="btn btn-ghost" style={{maxWidth: 360, justifyContent:'center', padding:'14px', marginTop: 12, borderStyle:'dashed'}}>
            マジックリンクを送る
          </button>
          <p style={{marginTop: 36, fontSize: 11, color:'var(--ink-mute)', maxWidth: 360, lineHeight: 1.6}}>
            個人用のアプリのため、新規登録は管理者からの招待制となっています。
          </p>
        </div>
      </div>
    </div>
  );
}

// ===================== MOBILE DASHBOARD =====================

function MobileDashboardScreen() {
  const total = window.TOTAL_PP;
  const goal = window.GOAL_PP;
  const pct = (total / goal) * 100;
  const remaining = goal - total;
  const flights = window.FLIGHTS.slice(0, 3);
  const suggestions = window.SUGGESTIONS.slice(0, 3);

  return (
    <div className="screen" style={{fontSize: 13}}>
      <header style={{padding:'18px 22px 14px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <div>
          <div className="brand-mark" style={{fontSize: 22}}>PP Ledger</div>
          <div className="brand-sub">ANA Domestic · 2026</div>
        </div>
        <div style={{width: 32, height: 32, borderRadius:'50%', background:'var(--ink)', color:'var(--paper)', display:'grid', placeItems:'center', fontFamily:'var(--font-display)', fontStyle:'italic'}}>K</div>
      </header>

      <div style={{flex:1, overflow:'auto', padding:'22px 22px 90px'}}>
        <div className="eyebrow">YTD Premium Points</div>
        <div style={{display:'flex', alignItems:'baseline', gap: 8, marginTop: 8}}>
          <span style={{fontFamily:'var(--font-mono)', fontSize: 52, fontWeight: 300, letterSpacing:'-0.02em', lineHeight: 1}}>
            {total.toLocaleString()}
          </span>
          <span style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontSize: 20, color:'var(--ink-mute)'}}>
            / {goal.toLocaleString()}
          </span>
        </div>
        <div style={{marginTop: 14}}>
          <div className="progress"><div className="progress-fill" style={{width: `${pct}%`}}/></div>
          <div style={{display:'flex', justifyContent:'space-between', marginTop: 8, fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.15em', color:'var(--ink-mute)', textTransform:'uppercase'}}>
            <span>{pct.toFixed(1)}%</span>
            <span>残り {remaining.toLocaleString()}</span>
          </div>
        </div>

        <div style={{marginTop: 28}}>
          <div className="eyebrow">おすすめ路線</div>
          <hr className="divider-thick" style={{margin:'8px 0 0'}}/>
          {suggestions.map((s, i) => (
            <div key={i} style={{padding:'16px 0', borderBottom:'1px solid var(--line-soft)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div>
                <RouteLine from={s.from} to={s.to} />
                <div style={{marginTop:4}}><CabinPill cabin={s.cabin}/></div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'var(--font-mono)', fontSize: 28, fontWeight: 300, letterSpacing:'-0.02em', lineHeight:1}}>{s.roundTripsNeeded}</div>
                <div className="eyebrow" style={{marginTop:4}}>往復</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{marginTop: 28}}>
          <div className="eyebrow">直近のフライト</div>
          <hr className="divider-thick" style={{margin:'8px 0 0'}}/>
          {flights.map(f => (
            <div key={f.id} style={{padding:'14px 0', borderBottom:'1px solid var(--line-soft)'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <RouteLine from={f.from} to={f.to} />
                <span className="mono" style={{fontSize: 14}}>{f.pp.toLocaleString()}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop: 4, fontSize: 11, color:'var(--ink-mute)'}}>
                <span className="mono">{f.flown_at} · {f.flight_number}</span>
                <CabinPill cabin={f.cabin}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* bottom nav */}
      <nav style={{position:'absolute', bottom:0, left:0, right:0, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', borderTop:'1px solid var(--line)', background:'var(--paper)', padding:'10px 0 14px'}}>
        {NAV.map((n, i) => (
          <button key={n.id} style={{background:'none', border:'none', padding:'6px 0', fontFamily:'var(--font-mono)', fontSize: 9, letterSpacing:'0.2em', color: i===0 ? 'var(--ink)' : 'var(--ink-mute)'}}>
            <div style={{fontSize: 14, marginBottom: 2}}>{['◐','✈','◇','↑'][i]}</div>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ===================== Expose =====================

Object.assign(window, {
  DashboardScreen, RoutesScreen, FlightsScreen, NewFlightScreen,
  ImportScreen, LoginScreen, MobileDashboardScreen,
});
