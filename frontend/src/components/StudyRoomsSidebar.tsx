import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, 
  Clock, 
  FileText, 
  CheckSquare, 
  Vote, 
  Pencil, 
  Youtube,
  Users,
  BookOpen,
  LogOut,
  Code,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import '../pages/StudyRooms.css';

interface StudyRoomsSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const StudyRoomsSidebar: React.FC<StudyRoomsSidebarProps> = ({ 
  isCollapsed: externalCollapsed, 
  onToggle 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (externalCollapsed !== undefined) {
      setIsCollapsed(externalCollapsed);
    }
  }, [externalCollapsed]);

  const features = [
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Real-time Chat",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Collaborative Notes",
    //   description: "Take and share notes together"
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "PDF Discussion",
    //   description: "Upload and discuss PDF documents"
    },
    {
      icon: <Pencil className="w-5 h-5" />,
      title: "Whiteboard",
    //   description: "Draw and visualize concepts together"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "File Sharing",
    //   description: "Share study materials and resources"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Study Timer",
    //   description: "Track and manage study sessions"
    },
    {
      icon: <CheckSquare className="w-5 h-5" />,
      title: "Task Manager",
    //   description: "Organize and track study tasks"
    },
    {
      icon: <Vote className="w-5 h-5" />,
      title: "Poll System",
    //   description: "Quick votes and quizzes"
    },
    {
      icon: <Youtube className="w-5 h-5" />,
      title: "Watch Together",
    //   description: "Synchronized educational videos"
    },
    {
      icon: <Code className="w-5 h-5" />,
      title: "Coding IDE",
    //   description: "Python code editor with AI assistance"
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className={`study-rooms-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-toggle" onClick={() => {
        setIsCollapsed(!isCollapsed);
        if (onToggle) onToggle();
      }}>
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </div>
      
      <div className="sidebar-header">
        <h2>StudyBuddy</h2>
        {/* <p>Features</p> */}
      </div>
      
      <div className="sidebar-content">
        {features.map((feature, index) => (
          <div key={index} className="sidebar-feature">
            <div className="feature-icon">{feature.icon}</div>
            {!isCollapsed && (
              <div className="feature-text">
                <h3>{feature.title}</h3>
                {/* <p>{feature.description}</p> */}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="sidebar-footer">
        <button className="logout-button" onClick={handleLogout}>
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default StudyRoomsSidebar;
