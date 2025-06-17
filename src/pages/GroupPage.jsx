import React, { useState, useEffect } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';

import '../components/styles/LayoutElements.css'

function Page ({data}) {

const userData = data;
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
}

const GroupPageElements = {
    Page
};

export default GroupPageElements;