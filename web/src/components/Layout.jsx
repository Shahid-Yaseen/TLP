import { useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import Header from './Header';

export function useLayoutSectionNav() {
  return useOutletContext();
}

const Layout = () => {
  const [sectionNav, setSectionNav] = useState(null);
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Header sectionNav={sectionNav} />
      <main>
        <Outlet context={{ setSectionNav }} />
      </main>
    </div>
  );
};

export default Layout;
