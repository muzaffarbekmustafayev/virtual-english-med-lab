import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg, #f1f4f8)' }}>
      <Sidebar />
      <main className="flex-1 min-h-screen" style={{ marginLeft: '260px' }}>
        <div style={{ padding: '36px 40px', maxWidth: 1100, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}


