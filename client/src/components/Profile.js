import React from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
};

export default Profile;