import ExpElements from './exp';
import './layoutElements.css'

function Footer () {
    return (
        <footer className="App-footer">
            {/* 홈, 랭킹, 챌린지, 그룹, 사용자 */}
            <div className="Footer-Icon"></div>
            <div className="Footer-Icon"></div>
            <div className="Footer-Icon"></div>
            <div className="Footer-Icon"></div>
            <div className="Footer-Icon"></div>
        </footer>
    );
}

function HomePage () {
    return (
        <div className='Main-container'>
            <header className="App-header">

            </header>
            <div className="App-contents">
                <ExpElements.TestExpContainer />
            </div>
            <Footer />
        </div>
    );
}

const LayoutElements = {
    HomePage,
    Footer
};

export default LayoutElements;