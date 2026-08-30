sed -i '1s|^|export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64\nexport PATH=$JAVA_HOME/bin:$PATH\n|' scripts/build-apk.sh
