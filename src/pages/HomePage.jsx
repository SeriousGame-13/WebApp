import React, { useState, useEffect, useRef } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
import '../components/styles/LoginPage.css';

function Page ({data}) {
    const userData = data;
    const containerRef = useRef(null);
    const timeRef = useRef(null); // Neu: Ref für das Zeit-Element
    const [isLandscape, setIsLandscape] = useState(false);

    const time = userData.formatDuration(userData.getTotalTrainingTime());

    // Funktion um Text automatisch anzupassen
    const autoFitText = (element) => {
        if (!element || !element.parentElement) return;
        
        const parent = element.parentElement;
        const maxWidth = parent.clientWidth; // Etwas Padding lassen
        
        // Mit einer vernünftigen Schriftgröße starten
        let fontSize = 18;
        element.style.fontSize = fontSize + 'px';
        element.style.fontWeight = 'bold';
        
        // Schriftgröße reduzieren bis Text passt
        while (element.scrollWidth > maxWidth && fontSize > 10) {
            fontSize -= 0.5;
            element.style.fontSize = fontSize + 'px';
        }
    };

    useEffect(() => {
        const checkOrientation = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setIsLandscape(width > height);
            }
        };

        // Text anpassen wenn Komponente geladen ist
        const fitText = () => {
            if (timeRef.current) {
                // Kurz warten damit Layout fertig ist
                setTimeout(() => autoFitText(timeRef.current), 10);
            }
        };

        // 초기 체크
        checkOrientation();
        fitText();

        // ResizeObserver를 사용하여 컨테이너 크기 변화 감지
        const resizeObserver = new ResizeObserver(() => {
            checkOrientation();
            fitText(); // Bei Größenänderung Text neu anpassen
        });
        
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // 윈도우 리사이즈 이벤트도 추가로 감지
        window.addEventListener('resize', () => {
            checkOrientation();
            fitText();
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
                    <ExpElements.NewCircleExpContainer level={userData.level} expnow={userData.points} expmax={1000} />
                </div>
                
                <div className="BottomGridSection">
                    <div className='HelloText'>
                        Good Morning, {userData.displayName}
                    </div>
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
                                <div className='HomeInfoName' ref={timeRef}>
                                   {time}
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
            </div>
        </div>
    )
}

const HomePageElements = {
    Page
};

export default HomePageElements;