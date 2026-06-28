import { motion } from 'framer-motion';

const SwipeComponent = () => {
  const handleSwipe = (direction) => {
    console.log(`Swiped ${direction}`);
    // Add logic to switch itinerary days
  };

  return (
    <motion.div
      onDragEnd={(event, info) => {
        if (info.offset.x > 50) {
          handleSwipe('right');
        } else if (info.offset.x < -50) {
          handleSwipe('left');
        }
      }}
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0' }}
    >
      Swipe Here
    </motion.div>
  );
};

export default SwipeComponent;