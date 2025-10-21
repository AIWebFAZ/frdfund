import os
import re

def fix_mixed_quotes(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Fix mixed quotes - change backtick-single-quote to backtick-backtick
                # Pattern: `${config.API_URL}/api/something', should be `${config.API_URL}/api/something`,
                content = re.sub(r'`(\$\{config\.API_URL\}[^`\']+)\'', r'`\1`', content)
                
                # Also fix: `${config.API_URL}/api/something' at end of line
                content = re.sub(r'`(\$\{config\.API_URL\}[^`]*?)\'', r'`\1`', content)
                
                if content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Fixed mixed quotes in: {filepath}")

if __name__ == '__main__':
    fix_mixed_quotes('c:/frdfund/frontend/src')
    print("All mixed quotes fixed!")
