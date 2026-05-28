import React from 'react';

const Profile = ({ user: initialUser }) => {
  const user = initialUser || (() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  })();

  return (
    <div className="page-container">
      <h1>Profile</h1>
      {user ? (
        <div>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>User ID:</strong> {user.id}</p>
        </div>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  );
};

export default Profile;