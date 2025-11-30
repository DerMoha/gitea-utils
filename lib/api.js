import axios from 'axios';

export class GiteaService {
    constructor(baseURL, token, httpClient = null) {
        this.client = httpClient || axios.create({
            baseURL: `${baseURL}/api/v1`,
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    async getRepos() {
        return this._fetchAll('/user/repos');
    }

    async _fetchAll(endpoint, params = {}) {
        let allData = [];
        let page = 1;
        const limit = 100;
        
        while (true) {
            const res = await this.client.get(endpoint, { 
                params: { ...params, page, limit } 
            });
            const data = res.data;
            
            if (!Array.isArray(data)) return data; // Fallback for non-array responses
            
            allData = allData.concat(data);
            if (data.length < limit) break;
            page++;
        }
        return allData;
    }

    async createRepo(name, description, isPrivate) {
        const res = await this.client.post('/user/repos', {
            name,
            description,
            private: isPrivate,
            auto_init: true
        });
        return res.data;
    }

    async deleteRepo(owner, repo) {
        await this.client.delete(`/repos/${owner}/${repo}`);
    }

    async getUsers() {
        const res = await this.client.get('/admin/users');
        return res.data;
    }

    async createUser(username, email, password) {
        const res = await this.client.post('/admin/users', {
            login_name: username,
            username,
            email,
            password,
            must_change_password: false
        });
        return res.data;
    }

    async createBranch(owner, repo, newBranch, oldBranch = 'main') {
        const res = await this.client.post(`/repos/${owner}/${repo}/branches`, {
            new_branch_name: newBranch,
            old_branch_name: oldBranch
        });
        return res.data;
    }

    async createMilestone(owner, repo, title, description, dueOn) {
        const body = { title, description };
        if (dueOn) body.due_on = dueOn;
        
        const res = await this.client.post(`/repos/${owner}/${repo}/milestones`, body);
        return res.data;
    }

    async getOrgs() {
        const res = await this.client.get('/user/orgs');
        return res.data;
    }

    async getOrgRepos(org) {
        const res = await this.client.get(`/orgs/${org}/repos`);
        return res.data;
    }

    async getOrgMembers(org) {
        const res = await this.client.get(`/orgs/${org}/members`);
        return res.data;
    }

    async getIssues(owner, repo) {
        const res = await this.client.get(`/repos/${owner}/${repo}/issues?state=all`);
        return res.data;
    }

    async createIssue(owner, repo, title, body) {
        const res = await this.client.post(`/repos/${owner}/${repo}/issues`, {
            title,
            body
        });
        return res.data;
    }

    async updateIssueState(owner, repo, index, state) {
        const res = await this.client.patch(`/repos/${owner}/${repo}/issues/${index}`, {
            state
        });
        return res.data;
    }

    async searchIssues(params) {
        const res = await this.client.get('/repos/issues/search', { params });
        return res.data;
    }
}