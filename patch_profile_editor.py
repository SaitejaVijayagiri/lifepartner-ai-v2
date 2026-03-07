import re

with open("apps/web/components/ProfileEditor.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r"\bbg-white\b(?!/)", "bg-white dark:bg-gray-800", content)
content = re.sub(r"\btext-gray-900\b", "text-gray-900 dark:text-gray-100", content)
content = re.sub(r"\btext-gray-700\b", "text-gray-700 dark:text-gray-300", content)
content = re.sub(r"\bborder-gray-100\b", "border-gray-100 dark:border-gray-800", content)
content = re.sub(r"\bborder-gray-200\b", "border-gray-200 dark:border-gray-700", content)
content = re.sub(r"\bbg-gray-50\b", "bg-gray-50 dark:bg-gray-900", content)
content = re.sub(r"\bbg-indigo-50/50\b", "bg-indigo-50/50 dark:bg-indigo-900/20", content)
content = re.sub(r"\bborder-indigo-200\b", "border-indigo-200 dark:border-indigo-800", content)

with open("apps/web/components/ProfileEditor.tsx", "w", encoding="utf-8") as f:
    f.write(content)
