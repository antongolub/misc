echo $'diff --git a/packages/upkeeper/myfile.txt b/packages/upkeeper/myfile.txt\\n--- a/packages/upkeeper/myfile.txt\\n+++ b/packages/upkeeper/myfile.txt\\n@@ -1 +1 @@\\n-my first string\\n+my second string\\n' | git apply -v
