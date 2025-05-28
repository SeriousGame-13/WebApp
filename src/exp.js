import './exp.css';
import React, { useState, useEffect } from 'react';

function NewLinearExpContainer({ level, expnow, expmax }) {
    const progress = Math.min((expnow / expmax) * 100, 100);
    
    return (
        <div className="linear-exp-container">
            <div className="linear-exp-bar">
                <div 
                    className="linear-exp-fill" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
}

function NewLinearExpContainerSimple({ expnow, expmax }) {
    const progress = Math.min((expnow / expmax) * 100, 100);
    
    return (
        <div className="linear-exp-container-simple">
            <div className="linear-exp-bar-simple">
                <div 
                    className="linear-exp-fill-simple" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
}

function NewLinearExpContainerWithProgress ({ level, expnow, expmax }) {
    const progress = Math.min((expnow / expmax) * 100, 100);
    
    return (
        <div className="linear-exp-container">
            <div className="stats">레벨 {level} | 경험치: {expnow} / {expmax}</div>
            <div className="linear-exp-bar">
                <div 
                    className="linear-exp-fill" 
                    style={{ width: `${progress}%` }}
                ></div>
                <div className="linear-exp-text">{Math.round(progress)}%</div>
            </div>
        </div>
    );
}

function NewCircleExpContainer({ level, expnow, expmax }) {
    const progress = Math.min((expnow / expmax) * 100, 100);
    const circumference = 2 * Math.PI * 85;
    const offset = circumference - (progress / 100) * circumference;
    
    return (
        <div className="circular-exp-container">
            <div className="circular-exp-bar">
                <svg className="circular-exp-svg">
                    <circle className="circular-bg" cx="100" cy="100" r="85"></circle>
                    <circle 
                        className="circular-progress" 
                        cx="100" 
                        cy="100" 
                        r="85"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: offset
                        }}
                    ></circle>
                </svg>
                <div className="circular-exp-text">
                    <div className='leveltitle'>Lv</div>
                    <div className="level">{level}</div>
                </div>
            </div>
        </div>
    );
}

function NewCircleExpContainerWithProgress({ level, expnow, expmax }) {
    const progress = Math.min((expnow / expmax) * 100, 100);
    const circumference = 2 * Math.PI * 85;
    const offset = circumference - (progress / 100) * circumference;
    
    return (
        <div className="circular-exp-container">
            <div className="circular-exp-bar">
                <svg className="circular-exp-svg">
                    <circle className="circular-bg" cx="100" cy="100" r="85"></circle>
                    <circle 
                        className="circular-progress" 
                        cx="100" 
                        cy="100" 
                        r="85"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: offset
                        }}
                    ></circle>
                </svg>
                <div className="circular-exp-text">
                    <div className="level">LV {level}</div>
                    <div className="progress">{Math.round(progress)}%</div>
                </div>
            </div>
            <div className="stats">경험치: {expnow} / {expmax}</div>
        </div>
    );
}

function TestExpContainer () {
    const [levelnow, setlevel] = useState(0);
    const [expnow, setexp] = useState(0);
    const expmax = 100;

    useEffect(() => {
        const interval = setInterval(() => {
            setexp(prevExp => {
                if (prevExp + 10 >= expmax) {
                    // 레벨업
                    setlevel(prevLevel => prevLevel + 1);
                    return 0; // 경험치 리셋
                }
                return prevExp + 10;
            });
        }, 1000);
        
        return () => clearInterval(interval);
    }, [expmax]); // expmax를 dependency에 추가

    return (
        <div>
            <NewCircleExpContainer level={levelnow} expnow={expnow} expmax={expmax} />
            <NewLinearExpContainer level={levelnow} expnow={expnow} expmax={expmax} />
        </div>
    )
}

const ExpElements = {
    NewLinearExpContainer,
    NewLinearExpContainerSimple,
    NewLinearExpContainerWithProgress,
    NewCircleExpContainer,
    NewCircleExpContainerWithProgress,
    TestExpContainer
};

export default ExpElements;