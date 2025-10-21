import os
import re

def fix_api_urls(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Replace all variations
                content = re.sub(r"'http://localhost:3000", "`${config.API_URL}", content)
                content = re.sub(r'"http://localhost:3000', '`${config.API_URL}', content)
                content = re.sub(r"`http://localhost:3000", "`${config.API_URL}", content)
                content = re.sub(r"http://localhost:3000", "${config.API_URL}", content)
                
                # Fix broken ones from PowerShell
                content = re.sub(r"\$\{config\.API_URL(/api/[^\}]+?)\}", r"${config.API_URL}\1}", content)
                content = re.sub(r"`\$\{config\.API_URL\}", "`${config.API_URL}", content)
                content = re.sub(r"'\$\{config\.API_URL\}", "`${config.API_URL}", content)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                print(f"Fixed: {filepath}")

if __name__ == '__main__':
    fix_api_urls('c:/frdfund/frontend/src')
    print("All files fixed!")
