import { render } from 'solid-js/web';

const App = () => <div>pet-genius — scaffold ok</div>;

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');
render(() => <App />, root);
