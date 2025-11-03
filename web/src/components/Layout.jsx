import Header from './Header';

const Layout = ({ children, sectionNav = null }) => {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Header sectionNav={sectionNav} />
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
