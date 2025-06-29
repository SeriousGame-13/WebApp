import React, { useState } from 'react';
import ProfileImageElements from '../utils/profileImageManager';




function Page({ data }) {
    const userData = data;


    return (
        <div className="AppContents">
            <ProfileImageElements.ProfileImageUploader userId={userData.uid} />
            <div>
                <p>Halle, {userData.displayName}!</p>
                <p>E-mail: {userData.email}</p>
                <p>Level: {userData.level}</p>
                <p>Active: {userData.isActive}</p>
                <p>Points: {userData.points}</p>
                <p>MaxRecord: {userData.longestStreak}</p>
            </div>
        </div>

    )
}

const UserPageElements = {
    Page
};

export default UserPageElements;
