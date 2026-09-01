import pygame
import random
import sys

# Initialize pygame
pygame.init()

# Constants
WINDOW_WIDTH = 600
WINDOW_HEIGHT = 400
CELL_SIZE = 20
FPS = 10

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)

# Directions
UP = (0, -1)
DOWN = (0, 1)
LEFT = (-1, 0)
RIGHT = (1, 0)

class Snake:
    def __init__(self):
        self.reset()
    
    def reset(self):
        self.body = [(5, 5), (4, 5), (3, 5)]
        self.direction = RIGHT
        self.grow = False
    
    def move(self):
        head_x, head_y = self.body[0]
        dir_x, dir_y = self.direction
        new_head = (head_x + dir_x, head_y + dir_y)
        
        self.body.insert(0, new_head)
        if not self.grow:
            self.body.pop()
        else:
            self.grow = False
    
    def change_direction(self, new_direction):
        # Prevent 180-degree turns
        if (new_direction[0] * -1, new_direction[1] * -1) != self.direction:
            self.direction = new_direction
    
    def check_collision(self):
        head = self.body[0]
        
        # Wall collision
        if head[0] < 0 or head[0] >= WINDOW_WIDTH // CELL_SIZE:
            return True
        if head[1] < 0 or head[1] >= WINDOW_HEIGHT // CELL_SIZE:
            return True
        
        # Self collision
        if head in self.body[1:]:
            return True
        
        return False
    
    def draw(self, screen):
        for segment in self.body:
            x = segment[0] * CELL_SIZE
            y = segment[1] * CELL_SIZE
            pygame.draw.rect(screen, GREEN, (x, y, CELL_SIZE, CELL_SIZE))

class Food:
    def __init__(self):
        self.position = (0, 0)
        self.randomize_position([])
    
    def randomize_position(self, snake_body):
        while True:
            x = random.randint(0, (WINDOW_WIDTH // CELL_SIZE) - 1)
            y = random.randint(0, (WINDOW_HEIGHT // CELL_SIZE) - 1)
            if (x, y) not in snake_body:
                self.position = (x, y)
                break
    
    def draw(self, screen):
        x = self.position[0] * CELL_SIZE
        y = self.position[1] * CELL_SIZE
        pygame.draw.rect(screen, RED, (x, y, CELL_SIZE, CELL_SIZE))

def main():
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption('Snake Game')
    clock = pygame.time.Clock()
    font = pygame.font.Font(None, 36)
    
    snake = Snake()
    food = Food()
    score = 0
    game_over = False
    
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            
            if event.type == pygame.KEYDOWN:
                if game_over:
                    if event.key == pygame.K_SPACE:
                        snake.reset()
                        food.randomize_position(snake.body)
                        score = 0
                        game_over = False
                else:
                    if event.key == pygame.K_UP:
                        snake.change_direction(UP)
                    elif event.key == pygame.K_DOWN:
                        snake.change_direction(DOWN)
                    elif event.key == pygame.K_LEFT:
                        snake.change_direction(LEFT)
                    elif event.key == pygame.K_RIGHT:
                        snake.change_direction(RIGHT)
        
        if not game_over:
            snake.move()
            
            # Check collision with food
            if snake.body[0] == food.position:
                snake.grow = True
                score += 10
                food.randomize_position(snake.body)
            
            # Check collision
            if snake.check_collision():
                game_over = True
        
        # Draw everything
        screen.fill(BLACK)
        snake.draw(screen)
        food.draw(screen)
        
        # Draw score
        score_text = font.render(f'Score: {score}', True, WHITE)
        screen.blit(score_text, (10, 10))
        
        # Draw game over message
        if game_over:
            game_over_text = font.render('Game Over! Press SPACE to restart', True, WHITE)
            text_rect = game_over_text.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2))
            screen.blit(game_over_text, text_rect)
        
        pygame.display.flip()
        clock.tick(FPS)

if __name__ == '__main__':
    main()
