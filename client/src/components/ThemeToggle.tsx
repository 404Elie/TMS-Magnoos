import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0 hover:bg-[hsl(175,100%,85%)] dark:hover:bg-slate-800 transition-all duration-300"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-[hsl(236,100%,58%)] hover:text-[hsl(266,66%,58%)] transition-colors duration-300" />
      ) : (
        <Sun className="h-4 w-4 text-slate-400 hover:text-slate-200 transition-colors duration-300" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}