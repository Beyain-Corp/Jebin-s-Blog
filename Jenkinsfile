pipeline {
    agent any

    triggers {
        // Runs every 2 minutes
        cron('H/2 * * * *')
    }

    options {
        // Prevent concurrent builds
        disableConcurrentBuilds()
        // Keep build history manageable
        buildDiscarder(logRotator(numToKeepStr: '50'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Sync Notion to GitHub') {
            steps {
                sh '''
                    chmod +x ./scripts/jenkins-sync.sh
                    ./scripts/jenkins-sync.sh
                '''
            }
        }
    }

    post {
        failure {
            echo "Sync automation failed. Please check logs and Notion API token."
        }
    }
}
