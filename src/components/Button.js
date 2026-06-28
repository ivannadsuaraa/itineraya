import React from 'react';
import { Button, DirectionsWalkIcon } from '@material-ui/core';
import { useContext } from 'react';

const UserContext = React.createContext();

const Button = ({ text }) => (
  <Button
    variant="contained"
    color="primary"
    startIcon={<DirectionsWalkIcon />}
    text={user ? "Empieza gratis" : "Ir a mis viajes"}
  >
    {text}
  </Button>
);

default export { Button };
