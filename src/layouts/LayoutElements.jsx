import React, { useState, useEffect } from 'react';

import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
import LoginPage from '../pages/LoginPage';
import UserManagement from '../services/firebase/UserManagementSystem';  
import GroupManagement from '../services/firebase/GroupManagementSystem';  
import DatamanagerElements from '../utils/dataManager';
import ProfileImageElements from '../utils/profileImageManager';
import UserModel from '../services/interfaces/user.jsx';
import { GROUP_ROLE } from '../services/interfaces/constants.jsx';

import './LayoutElements.css'


function Footer({ selectedIcon, onIconSelect }) {
    
    return (
        <footer className="AppFooter">
            <div className='FooterIconbox' 
                style={{ color: selectedIcon === 'home' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => onIconSelect('home')}>
                <IconElements.HomeIcon/>
                <div className='IconName' style={{ color: selectedIcon === 'home' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    HOME
                </div>
            </div>
            
            <div className='FooterIconbox'
                style={{ color: selectedIcon === 'ranking' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => onIconSelect('ranking')}>
                <IconElements.RankingIcon/>
                <div className='IconName' style={{ color: selectedIcon === 'ranking' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    RANKING
                </div>
            </div>
            
            <div className='FooterIconbox' 
                style={{ color: selectedIcon === 'challenge' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => onIconSelect('challenge')}>
                <IconElements.ChallengeIcon/>
                <div className='IconName' style={{ color: selectedIcon === 'challenge' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    CHALLENGE
                </div>
            </div>
            
            <div className='FooterIconbox'
                style={{ color: selectedIcon === 'group' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => onIconSelect('group')}>
                <IconElements.GroupIcon/>
                <div className='IconName' style={{ color: selectedIcon === 'group' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    GROUP
                </div>
            </div>
            
            <div className='FooterIconbox' 
                style={{ color: selectedIcon === 'user' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => onIconSelect('user')}>
                <IconElements.UserIcon/>
                <div className='IconName' style={{ color: selectedIcon === 'user' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    USER
                </div>
            </div>
        </footer>
    );
}

function UserInfoHeaderContainer ({ user }) {
    const name = user.displayName;

    return (
        <div className='SeyHelloContainer'>
            <DatamanagerElements.ProfileImageDisplay userId={user.uid} imageclass={'ProfileImageForHeader'}/>
            <div className='SeyHello'>
                <div className='UserName'>{name}</div>
            </div>
            <button className='LogoutButton'
                onClick={UserManagement.logoutUser}>
                Logout
            </button>
        </div>
    )
}

function IconContainer () {
    return (
        <div className='HeaderIconcontainer'>
            <div className='HeaderIconbox'>
                <IconElements.NotificationIcon />
            </div>
            <div className='HeaderIconbox'>
                <IconElements.SettingsIcon />
            </div>
        </div>
    );
}

const Home = ({Data}) => {
    const userData = Data;

    return (
        <div className="AppContents">
            <div className='ExpContainer'>
                <ExpElements.NewCircleExpContainer level={userData.level} expnow={userData.points} expmax={1000} />
                <div className='HomeInfoContainer'>
                    <div className='HomeInfo'>
                        <div className='HomeInfoItemContainer'
                            style={{ color: 'var(--main-color)'}}>
                            <IconElements.RankingIcon/>
                            <div className='HomeInfoName'>
                                11
                            </div>
                            <p style={{ textAlign: 'center'}}>Place</p>
                        </div>
                    </div>
                    <div className='HomeInfo'>
                        <div className='HomeInfoItemContainer'
                            style={{ color: 'var(--main-color)'}}>
                            <IconElements.TimeIcon/>
                            <div className='HomeInfoName'>
                                45 min
                            </div>
                            <p style={{ textAlign: 'center'}}>Training</p>
                        </div>
                    </div>
                    <div className='HomeInfo'>
                        <div className='HomeInfoItemContainer'
                            style={{ color: 'var(--main-color)'}}>
                            <IconElements.FitnessIcon/>
                            <div className='HomeInfoName'>
                                3/7
                            </div>
                            <p style={{ textAlign: 'center'}}>Goal</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className='GuideText'>
                    Active Group Exercise
            </div>
            <div className='ExerciseContainer'>
                <div className='GroupExerciseContainer'>
                    
                    <div className='GroupExerciseHeader'>
                        Group exercise Name 1
                    </div>
                    <div className='GroupExerciseContents'>
                        This is test information about active group exercise contents and this is place for description.
                    </div>
                    <div className='GroupExpContainer'>
                        <ExpElements.NewLinearExpContainerSimple expnow={2} expmax={10} />
                    </div>
                </div>
                <div className='GroupExerciseContainer'>
                    
                    <div className='GroupExerciseHeader'>
                        Group exercise Name 2
                    </div>
                    <div className='GroupExerciseContents'>
                        This is test information about active group exercise contents and this is place for description. And this is a long long long text, and it's very long. Really looooooooooong.
                    </div>
                    <div className='GroupExpContainer'>
                        <ExpElements.NewLinearExpContainerSimple expnow={7} expmax={10} />
                    </div>
                </div>
                <div className='GroupExerciseContainer'>
                    
                    <div className='GroupExerciseHeader'>
                        Group exercise Name 3
                    </div>
                    <div className='GroupExerciseContents'>
                        Short text.    
                    </div>
                    <div className='GroupExpContainer'>
                        <ExpElements.NewLinearExpContainerSimple expnow={5} expmax={10} />
                    </div>
                </div>
            </div>
            
        </div>
    )
}

const Ranking = ({Data}) => {
    const userData = Data;

    return (
        <div className="AppContents">
            This is Rankingpage !!!
        </div>
    )
}

const Challenge = ({Data}) => {
    const userData = Data;

    return (
        <div className="AppContents">
            This is Challengepage !!!
        </div>
    )
}
const Group = ({Data}) => {
    const userData = Data;
    const [groupName, setGroupName] = useState('');
    const [memberId, setMemberId] = useState('');

    const handleCreateGroup = async () => {
        const user = await UserManagement.getCurrentUser();
        GroupManagement.createGroup(user.uid, groupName, 'Description of the group')
    };

    const handleAddMember = async () => {
        const user = await UserManagement.getCurrentUser();
        const groups = await GroupManagement.getUserGroups(user.uid);
        GroupManagement.addGroupMember(groups[0].groupId, memberId, GROUP_ROLE.MEMBER);
    };

    const handleRemoveMember = async () => {
        const user = await UserManagement.getCurrentUser();
        const groups = await GroupManagement.getUserGroups(user.uid);
        GroupManagement.removeGroupMember(groups[0].groupId, user.uid, memberId)
    };

    const handleDeleteGroup = async () => {
        const user = await UserManagement.getCurrentUser();
        const groups = await GroupManagement.getUserGroups(user.uid);
        GroupManagement.deleteGroup(groups[0].groupId, user.uid);
    };

    return (
        <div className="AppContents">
            <h2>Group Management</h2>
            
            <div className="GroupInputContainer">
                <div className="InputField">
                    <label htmlFor="groupName">Group Name:</label>
                    <input 
                        type="text" 
                        id="groupName" 
                        value={groupName} 
                        onChange={(e) => setGroupName(e.target.value)} 
                        placeholder="Enter group name"
                    />
                </div>
                
                <div className="InputField">
                    <label htmlFor="memberEmail">Member Email:</label>
                    <input 
                        type="email" 
                        id="memberEmail" 
                        value={memberId} 
                        onChange={(e) => setMemberId(e.target.value)} 
                        placeholder="Enter member email"
                    />
                </div>
            </div>
            
            <div className="GroupButtonContainer">
                <button className="GroupButton" onClick={handleCreateGroup}>Create Group</button>
                <button className="GroupButton" onClick={handleAddMember}>Add Member</button>
                <button className="GroupButton" onClick={handleRemoveMember}>Remove Member</button>
                <button className="GroupButton" onClick={handleDeleteGroup}>Delete Group</button>
            </div>
            <div>
                This is Grouppage !!!
            </div>
        </div>
    );
};

const User = ({ Data }) => {
    const userData = UserModel.fromJSON(Data);

    return (
        <div className="AppContents">
            <ProfileImageElements.ProfileImageUploader userId={userData.uid} />
            <div>
                <p>Hallo, {userData.displayName}!</p>
                <p>E-mail: {userData.email}</p>
                <p>Level: {userData.level}</p>
                <p>Active: {userData.isActive ? 'Yes' : 'No'}</p>
                <p>Points: {userData.points}</p>
                <p>MaxRecord: {userData.longestStreak}</p>
                <p>Created At: {userData.getCreateAt()}</p>
            </div>
        </div>
    );
};



function HomePage() {
    const { currentUser, userData, loading } = DatamanagerElements.useAuth('users');

    const [currentPage, setCurrentPage] = useState('home');
    
    const renderCurrentPage = () => {
        switch(currentPage) {
            case 'home':
                return <Home Data={userData} />
            case 'ranking':
                return <Ranking Data={userData} />
            case 'challenge':
                return <Challenge Data={userData} />
            case 'group':
                return <Group Data={userData} />
            case 'user':
                return <User Data={userData} />
            default:
                return <User Data={userData} />
        }
    }

    if (loading) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>...Loading...</h2>
                </div>
            </div>
        )
    }

    if (!userData) {
        return <LoginPage.AppLogin/>;
    }
    
    return (
        <div className='MainContainer'>
            <header className="AppHeader">

                <UserInfoHeaderContainer user={userData}/>
                <IconContainer />
            </header>
            <div className='Line'/>
            {renderCurrentPage()}

            <div className='Line'/>
            <Footer selectedIcon={currentPage} onIconSelect={setCurrentPage} />
        </div>
    );
}

const LayoutElements = {
    Footer,
    IconContainer,
    HomePage
};

export default LayoutElements;