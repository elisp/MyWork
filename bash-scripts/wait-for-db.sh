echo "waiting for db"
retries=10
until nc -z redis 6379; do
    echo "$(date) - waiting for redis..."
    sleep 1
    retries=$((retries-1));
    if [ $retries -lt 0 ] ; then
      exit 1
    fi
done
exec $1
