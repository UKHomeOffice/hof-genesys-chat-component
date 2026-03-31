import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderCharacterCouterComponent } from '../../helpers/render-helpers';

describe('Character counter', () => {
  test('Should inform user about remaining character from 4096 character', () => {
    renderCharacterCouterComponent(4096, 3896);
    const character = screen.getByTestId('character-counter');
    expect(character).toBeInTheDocument();
    expect(character).toBeVisible();
    expect(character).toHaveTextContent('200 characters left');
  });


  test('Should ask user to remove more character if it exceed more than 4096 character', () => {
    renderCharacterCouterComponent(4096, 5000);
    const character = screen.getByTestId('character-counter');
    expect(character).toBeInTheDocument();
    expect(character).toBeVisible();
    expect(character).toHaveTextContent('904 characters over');
  });
});


