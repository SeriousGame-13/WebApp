import React, { useState, useEffect } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';

import '../components/styles/LayoutElements.css'

const GroupList = ({data}) => {

    const userData = data;
    return (
        <div className='GroupContainer'>
            <MakeList data={userData} />
        </div>
    )
}

const MemberList = ({data}) => {

    const userData = data;

    return (
        <div className='GroupContainer'>
            <MakeList data={userData} />
        </div>
    )
}

const ChallengeList = ({data}) => {

    const userData = data;

    return (
        <div className='GroupContainer'>
            <MakeList data={userData} />
        </div>
    )
}

function MakeList ({data}) {
    return (
        <div>
            <div className='GuideText'>
                Active Group Exercise
            </div>
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
            
    )
}

function Page ({data}) {

    const userData = data;
    const [currentPageInGroup, setCurrentPageInGroup] = useState('grouplist');

    const renderCurrentPageInGroup = () => {
        switch(currentPageInGroup) {
            case 'grouplist':
                return <GroupList data={userData} />
            case 'memberlist':
                return <MemberList data={userData} />
            case 'challengelist':
                return <ChallengeList data={userData} />
            default:
                return <GroupList data={userData} />
        }
    }

    return (
        <div className="AppContents">
            <header className="ContentsHeader">
                <div className='ContentsHeaderItem'>
                    My Groups
                    </div>
                <div className='ContentsHeaderItem'>
                    Members
                </div>
                <div className='ContentsHeaderItem'>
                    Challenges
                </div>
            </header>
            {renderCurrentPageInGroup ()}
        </div>
    )
}

const GroupPageElements = {
    Page
};

export default GroupPageElements;