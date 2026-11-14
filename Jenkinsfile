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

    environment {
        NOTION_DATABASE_ID = '418ae0c306ff80169771de6884e226f5'
    }

    stages {
        stage('Sync Notion to GitHub') {
            steps {
                script {
                    def credsList = []

                    // 1. Inject NOTION_API_KEY if configured in Jenkins Credentials
                    try {
                        withCredentials([string(credentialsId: 'NOTION_API_KEY', variable: '_T_KEY')]) {
                            credsList.add(string(credentialsId: 'NOTION_API_KEY', variable: 'NOTION_API_KEY'))
                        }
                    } catch (Exception e) {
                        echo "Notice: Credential 'NOTION_API_KEY' not found in Jenkins Credentials. Will check environment or .env.local."
                    }

                    // 2. Inject github-token for authenticated git push
                    try {
                        withCredentials([usernamePassword(credentialsId: 'github-token', usernameVariable: '_T_U', passwordVariable: '_T_P')]) {
                            credsList.add(usernamePassword(credentialsId: 'github-token', usernameVariable: 'GH_USER', passwordVariable: 'GH_TOKEN'))
                        }
                    } catch (Exception e) {
                        echo "Notice: Credential 'github-token' not found in Jenkins Credentials."
                    }

                    // Execute sync with all discovered credentials
                    withCredentials(credsList) {
                        sh '''
                            chmod +x ./scripts/jenkins-sync.sh
                            ./scripts/jenkins-sync.sh
                        '''
                    }
                }
            }
        }
    }

    post {
        failure {
            echo "Sync automation failed. Please ensure NOTION_API_KEY is configured in Jenkins Credentials or Global Environment Variables."
        }
    }
}
