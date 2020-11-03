import React from "react";
import {Redirect} from 'react-router-dom'

const main_menu_style = 
{
    textAlign: "center",
    paddingTop: "20vh",
}

const text_style = 
{
    fontSize: "20vh",
}

const button_style = 
{
    borderRadius: "1vh",
    height: "15vh",
    width: "30vh",
    marginTop: "5vh",
    marginLeft: "5vh",
    marginRight: "5vh",
    color: "#b3b3b3",
    backgroundColor: "#000000",
    fontSize: "5vh",
    border: "2px solid #b3b3b3",
}

export default class MainMenu extends React.Component
{   
    state = {redirect: false}

    setRedirect = () => {
    this.setState({
        redirect: true
    })
    }

    renderRedirect = () => {
    if (this.state.redirect) {
        return <Redirect to='/About'/>
    }
    }
    
    render()
    {
        return (
        <div style={main_menu_style}>
            {this.renderRedirect()}
            <span style={text_style}>Life Dots</span>
            <br></br>
            <button style={button_style} onClick={this.setRedirect}>
                About
            </button>
            <button style={button_style}>
                Start
            </button>
        </div>
        );
    }
}
