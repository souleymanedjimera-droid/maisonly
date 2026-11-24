export const metadata = { title: 'Maisonly – Gestion immobilière', description: 'Le logiciel des agences immobilières au Sénégal' };
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <style>{`
          :root{--bg:#eef2f5;--card:#fff;--tx:#12263a;--mu:#62748a;--pr:#0d8f7a;--bd:#d9e1e8;--rd:#c8372d}
          @media(prefers-color-scheme:dark){:root{--bg:#0d1722;--card:#15232f;--tx:#e8eff5;--mu:#8fa3b5;--pr:#2fd0b5;--bd:#25384a;--rd:#ff7a6e}}
          *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font-family:system-ui,sans-serif;line-height:1.45}
          .w{max-width:900px;margin:0 auto;padding:16px}.card{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:16px;margin-bottom:12px}
          button{font:inherit;font-weight:600;background:var(--pr);color:#fff;border:0;border-radius:8px;padding:10px 14px;cursor:pointer}
          button.g{background:transparent;color:var(--tx);border:1px solid var(--bd)}button.on{outline:2px solid var(--tx)}
          input,select{font:inherit;width:100%;padding:10px;border:1px solid var(--bd);border-radius:8px;background:var(--card);color:var(--tx);margin:4px 0 10px}
          .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between}.mu{color:var(--mu)}.err{color:var(--rd)}
          .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}.chips{display:flex;gap:8px;overflow-x:auto;margin-bottom:16px}.chips button{white-space:nowrap}
          .it{border-top:1px solid var(--bd);padding:10px 0;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center}
        `}</style>
        {children}
      </body>
    </html>
  );
}
