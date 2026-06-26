import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const OnboardingTour = () => {
  useEffect(() => {
    const tourCompleted = localStorage.getItem('finwise_tour_completed');
    
    if (!tourCompleted) {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: false,
        doneBtnText: '[ get started ]',
        nextBtnText: 'next →',
        prevBtnText: '← prev',
        steps: [
          {
            element: '#tour-balance',
            popover: {
              title: 'Welcome to Finwise!',
              description: 'This is your wallet summary. Here you can see your total balance, monthly income, and expenses at a glance.',
              side: "bottom", align: 'start'
            }
          },
          {
            element: '#add-transaction-btn',
            popover: {
              title: 'Add Transactions',
              description: 'Click here to log a new expense or income. It will instantly update your balance and charts.',
              side: "left", align: 'start'
            }
          },
          {
            element: '#tour-transactions',
            popover: {
              title: 'Transaction History',
              description: 'All your recent activity appears here. You can search, filter by category, or delete them if you made a mistake.',
              side: "top", align: 'start'
            }
          },
          {
            element: '#tour-recurring',
            popover: {
              title: 'Recurring Payments',
              description: 'Keep track of subscriptions and bills. When they are due, just click the checkmark to mark them as paid automatically!',
              side: "left", align: 'start'
            }
          },
          {
            element: '#tour-insights',
            popover: {
              title: 'AI Financial Insights',
              description: 'Let our AI analyze your spending patterns and give you personalized advice. Try generating an insight once you add some data!',
              side: "right", align: 'start'
            }
          },
          {
            element: '#tour-debts',
            popover: {
              title: 'Track IOUs',
              description: 'Lent money to a friend? Borrowed for lunch? Keep track of all your debts here and mark them settled when paid.',
              side: "right", align: 'start'
            }
          }
        ],
        onDestroyStarted: () => {
          localStorage.setItem('finwise_tour_completed', 'true');
          driverObj.destroy();
        }
      });

      // Slight delay to let the dashboard fully render
      setTimeout(() => {
        driverObj.drive();
      }, 500);
    }
  }, []);

  return null;
};

export default OnboardingTour;
