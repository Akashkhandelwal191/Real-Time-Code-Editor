import React from 'react';
import Avatar from 'react-avatar';

const Client = ({ username, avatar }) => {
    return (
        <div className="client">
            {avatar ? (
                <img src={avatar} alt={username} style={{ width: 50, height: 50, borderRadius: 12, objectFit: 'cover' }} />
            ) : (
                <Avatar name={username} size={50} round="14px" />
            )}
            <span className="userName">{username}</span>
        </div>
    );
};

export default Client;