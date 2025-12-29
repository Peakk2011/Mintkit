import { createState } from '../../state/create-state.js';
import { Router } from '../core/router.js';

/**
 * Higher-Order Component for components that want to access route information
 * @param {Function} Component - Component function that want to wrap
 * @returns {Function} - Wrapped component router props
 */
export function withRouter(Component) {
    return (props) => {
        const state = createState({
            path: Router.getPath(),
            params: Router.getParams()
        });

        const unsubscribe = Router.route('*', (params) => {
            state.set({
                path: Router.getPath(),
                params: Router.getParams()
            });
        });

        const originalOnUnmount = props.onUnmount;
        props.onUnmount = () => {
            unsubscribe();
            if (originalOnUnmount) originalOnUnmount();
        };

        return Component({ ...props, router: state.get() });
    };
}