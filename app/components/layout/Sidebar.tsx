import { Link, useLocation } from "@remix-run/react";
import { Icon } from "@shopify/polaris";
import {
  DiscountIcon,
  ChartVerticalIcon,
  QuestionCircleIcon
} from "@shopify/polaris-icons";

export function Sidebar() {
  const location = useLocation();
  
  const navigation = [
    { name: "Campañas", href: "/app/campaigns", icon: DiscountIcon },
    { name: "Analíticas", href: "/app/analytics", icon: ChartVerticalIcon },
    { name: "Ayuda", href: "/app/help", icon: QuestionCircleIcon },
  ];

  const isActive = (href: string) => location.pathname.startsWith(href);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Link to="/app" className="logo">
          <Icon source={DiscountIcon} />
          <span>Discounty</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`nav-item ${isActive(item.href) ? "active" : ""}`}
          >
            <Icon source={item.icon} />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <style>{`
        .sidebar {
          width: 240px;
          background: #f6f6f7;
          height: 100vh;
          border-right: 1px solid #e1e3e5;
          display: flex;
          flex-direction: column;
        }
        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #e1e3e5;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 18px;
          color: #202223;
          text-decoration: none;
        }
        .sidebar-nav {
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          color: #202223;
          text-decoration: none;
          font-size: 14px;
          transition: background 0.2s;
        }
        .nav-item:hover {
          background: #e4e5e7;
        }
        .nav-item.active {
          background: #005bd3;
          color: white;
        }
      `}</style>
    </div>
  );
}