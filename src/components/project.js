import React, { Component } from 'react';
import { List, is, Map } from 'immutable';

import '../common.scss'

class Project extends Component {
    constructor(props) {
        super(props);
        let file = this.props.project.get('files').findEntry(v => v.get('type') === 'file');
        this.state = {
            folders: {}, // collapsed,
            collapseProjectSelector: true,
            selectedFilePath: List().push(file[0]),
            configureChanged: false,
            config: this.props.project.get('config').toJS(),
        };
        this.initState(this.state.folders, this.props.project.get('files'), true);
    }

    componentDidUpdate(prevProps, prevState) {
        if (!is(prevProps.project, this.props.project)) {
            let file = this.props.project.get('files').findEntry(v => v.get('type') === 'file');
            this.setState(() => {
                return {
                    config: this.props.project.get('config').toJS(),
                    selectedFilePath: List().push(file[0]),
                };
            });
        }
    }

    componentDidMount() {
        {
            let { top, left, right, bottom, width, height } = this.refs.project.getBoundingClientRect();
            this.props.setProjectComponentSize({
                top, left, right, bottom, width, height,
            });
        }
        {
            let { top, left, right, bottom, width, height } = this.refs.configCloud.getBoundingClientRect();
            this.props.setConfigCloudComponentSize({
                top, left, right, bottom, width, height,
            });
        } {
            let { top, left, right, bottom, width, height } = this.refs.configLocal.getBoundingClientRect();
            this.props.setConfigLocalComponentSize({
                top, left, right, bottom, width, height,
            });
        }
    }

    initState(state, files, root, folderName) {
        for (let [k, v] of files) {
            if (v.get('type') === 'directory') {
                this.initState(state, v.get('data'), false, k);
            }
        }
        if (!root) {
            state[folderName] = true;
            state.another = 1234;
        }
    }

    toggleFolderCollapsed = (folderName) => {
        this.setState((prev) => {
            return {
                folders: Object.assign(prev.folders, {
                    [folderName]: !prev.folders[folderName],
                }),
            }
        });
    }

    toggleProjectSelectorCollapsed = () => {
        this.setState((prev) => {
            return {
                collapseProjectSelector: !prev.collapseProjectSelector,
            }
        })
    }

    fileClicked = (path) => {
        this.setState(() => {
            return {
                selectedFilePath: path,
            }
        })
        this.props.setEditorPath(path);
        if (this.props.highlightProject) {
            this.props.nextGuideAfterProject();
        }
    }

    handleChange = (key, event) => {
        let newConfig = Object.assign({}, this.state.config, {
            [key]: event.target.value,
        })
        let configureChanged = !is(this.props.project.get('config'), Map(newConfig));
        this.setState((prev) => {
            return {
                configureChanged,
                config: newConfig,
            };
        });
    }

    revertConfig = () => {
        this.setState(() => {
            return {
                configureChanged: false,
                config: this.props.project.get('config').toJS(),
            };
        });
    }

    saveConfig = () => {
        this.props.setProjectConfig(this.state.config);
        this.setState(() => {
            return {
                configureChanged: false,
            };
        });
        this.props.nextGuideAfterConfigLocal();
    }

    renderProjects(allProjects) {
        let items = [];
        for (let [k, v] of allProjects) {
            items.push(<div key={k} className="project-item" onClick={this.props.selectProject.bind(this, k)}>{v.get('displayName')}</div>);
        }
        return items;
    }

    renderFile(key, value, path) {
        return <div key={key} onClick={this.fileClicked.bind(this, path)} className={`project-file ${(is(this.state.selectedFilePath, path)) ? 'project-file-selected' : ''}`}>{key}</div>;
    }

    renderItems(files, root, folderName, path = List()) {
        let items = [];
        for (let [k, v] of files) {
            if (v.get('type') === 'file') {
                items.push(this.renderFile(k, v, path.push(k)));
            } else if (v.get('type') === 'directory') {
                items.push(this.renderItems(v.get('data'), false, k, path.push(k, 'data')));
            }
        }
        if (root) {
            return items;
        } else {
            return <div key="project-folder-container" className="project-folder-container">
                <div onClick={this.toggleFolderCollapsed.bind(this, folderName)} className={`project-folder ${this.state.folders[folderName] ? "hide-items" : "show-items"}`}><span className={this.state.folders[folderName] ? "folder-icon-collapsed" : "folder-icon-expanded"} />{folderName}</div>
                {items}
            </div>;
        }
    }

    render() {
        let deployItem;
        if (this.props.project.has('deployLink')) {
            deployItem = <div ref="configCloud" className={`configure-deploy-link ${this.props.highlightConfigCloud && 'highlight'}`}><a target="_blank" className={`${this.props.nextGuideAfterConfigCloud && 'highlight'}`} href={this.props.project.get('deployLink')} ><i className="fa fa-cloud-upload" aria-hidden="true"></i>deploy</a></div>
        }
        let configureItems = [];
        for (let [k, v] of this.props.project.get('config')) {
            configureItems.push(
                <div key={k} className="configure-item" >
                    <div className="configure-item-key">{k}</div>
                    <input type="text" className="configure-item-value" value={this.state.config[k]} onChange={this.handleChange.bind(this, k)} />
                </div>
            );
        }
        return (
            <div className="project-container">
                <div className={`current-project ${this.state.collapseProjectSelector ? "hide-items" : "show-items"}`} onClick={this.toggleProjectSelectorCollapsed}>
                    <i className={`fa ${this.state.collapseProjectSelector ? "fa-caret-down" : "fa-caret-up"}`} aria-hidden="true"></i>
                    {this.props.project.get('displayName')}
                    <div className="project-items-container" >
                        {this.renderProjects(this.props.allProjects)}
                    </div>
                </div>

                <div ref="project" className={`project-explorer ${this.props.highlightProject && 'highlight'}`} >
                    {this.renderItems(this.props.project.get('files'), true)}
                </div>

                <div ref="configLocal" className={`configure-container ${this.props.highlightConfigLocal && 'highlight'}`} >
                    <div className="configure-container-header" >
                        <span className="configure-container-title">Configure</span>
                        <span className={`configure-button ${this.state.configureChanged ? '' : 'hide'}`}>
                            <span onClick={this.saveConfig}><i className="fa fa-floppy-o" aria-hidden="true"></i></span>
                            <span onClick={this.revertConfig}><i className="fa fa-undo" aria-hidden="true"></i></span>
                        </span>
                    </div>
                    {deployItem}
                    {configureItems}
                </div>
            </div>
        );
    }
}

export default Project;