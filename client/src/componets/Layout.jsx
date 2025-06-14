import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "./Header";
import LoginModal from "./LoginModal";
import AuthRouter from "./AuthRouter";

const Layout = () => {
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isAuthenticated = useSelector((state) => state.app.authStatus);
  // Specify the routes where the Header should not appear
  const noHeaderRoutes = [
    "/problems/:id", 
    "/problems/:id/:batchId"
    // Removed "/login" so header shows on login page
  ];

  // Check if the current route matches any of the noHeaderRoutes
  const isNoHeaderRoute = noHeaderRoutes.some((route) => {
    // Create a regex pattern that matches route params
    const pattern = route.replace(/:\w+/g, "[^/]+");
    const routePattern = new RegExp(`^${pattern}$`);
    return routePattern.test(location.pathname);
  });

  return (
    <AuthRouter>
      <div>
        {!isNoHeaderRoute && (
          <Header 
            isAuthenticated={isAuthenticated} 
            onLoginClick={() => setShowLoginModal(true)} 
          />
        )}
        <main>
          <Outlet context={{ showLoginModal, setShowLoginModal }} />
        </main>
        
        {/* LoginModal with proper onClose handler to auto-close */}
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </div>
    </AuthRouter>
  );
};

export default Layout;
