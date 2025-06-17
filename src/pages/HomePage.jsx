import React, { useState, useEffect, useRef } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';

import '../components/styles/HomePage.css';

import LastWorkoutsDisplay from '../components/ui/LastWorkoutsDisplay';

function Page({ data }) {
    const userData = data;
    const containerRef = useRef(null);
    const timeRef = useRef(null); // Neu: Ref für das Zeit-Element
    const [isLandscape, setIsLandscape] = useState(false);

    const time = userData.formatDuration(userData.getTotalTrainingTime());



    useEffect(() => {
        const checkOrientation = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setIsLandscape(width > height);
            }
        };

        // 초기 체크
        checkOrientation();

        // ResizeObserver verwenden um Containergrößenänderungen zu erkennen
        const resizeObserver = new ResizeObserver(() => {
            checkOrientation();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Fenster-Resize-Event zusätzlich erkennen
        window.addEventListener('resize', () => {
            checkOrientation();
        });

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', checkOrientation);
        };
    }, [time]); // Zeit als Abhängigkeit hinzufügen

    return (
        <div className="AppContents" ref={containerRef}>
            <div className={`MainContentWrapper ${isLandscape ? 'landscape' : 'portrait'}`}>
                <div className="TopGridSection">
                    <ExpElements.NewCircleExpContainer level={userData.level} expnow={userData.points} expmax={userData.currentMaxPoints()} />
                </div>

                <div className="BottomGridSection">
                    <div className='HelloText'>
                        Good Morning, {userData.displayName}
                    </div>
                    <div className='HomeInfoContainer'>
                        <div className='HomeInfo'>
                            <div className='HomeInfoItemContainer'
                                style={{ color: 'var(--main-color)' }}>
                                <IconElements.RankingIcon />
                                <div className='HomeInfoName'>
                                    11
                                </div>
                                <p style={{ textAlign: 'center' }}>Place</p>
                            </div>
                        </div>
                        <div className='HomeInfo'>
                            <div className='HomeInfoItemContainer'
                                style={{ color: 'var(--main-color)' }}>
                                <IconElements.TimeIcon />
                                <div className='HomeInfoName' ref={timeRef}>
                                    {time}
                                </div>
                                <p style={{ textAlign: 'center' }}>Training</p>
                            </div>
                        </div>
                        <div className='HomeInfo'>
                            <div className='HomeInfoItemContainer'
                                style={{ color: 'var(--main-color)' }}>
                                <IconElements.FitnessIcon />
                                <div className='HomeInfoName'>
                                    3/7
                                </div>
                                <p style={{ textAlign: 'center' }}>Goal</p>
                            </div>
                        </div>
                        <div className='HomeInfo'>
                            <div className='HomeInfoItemContainer'
                                style={{ color: 'var(--main-color)' }}>
                                <IconElements.CalorieIcon />
                                <div className='HomeInfoName'>
                                    {userData.getCalories()}
                                </div>
                                <p style={{ textAlign: 'center' }}>Total Colories</p>
                            </div>
                        </div>
                    </div>
                    <div className='GuideText'>
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
                    <LastWorkoutsDisplay userData={userData} />
                </div>
            </div>
        </div>
    )
}

const HomePageElements = {
    Page
};

export default HomePageElements;