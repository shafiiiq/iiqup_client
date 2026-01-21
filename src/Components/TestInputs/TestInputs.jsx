import React, { useState } from 'react';
import Input from '../../common/Input/Input';

function TestInputs() {
    const [formData, setFormData] = useState({
        text: '',
        email: '',
        password: '',
        search: '',
        url: '',
        tel: '',
        number: '',
        select: '',
        checkbox: false,
        radio: false,
        file: '',
        date: '',
        textarea: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div style={{
            padding: '40px',
            display: 'flex',
            alignContent: 'center',
            justifyContent:'center',
            gap: '30px',
            width: '100vw',
            height: '100vh'
        }}>
            <Input
                type="text"
                name="text"
                value={formData.text}
                onChange={handleChange}
                placeholder="Enter your full name here"
                label="Full Name"
                iconLeft="person"
                iconMarginLeft="3xl"
                iconToggle="search"
                iconFontSize='33xl'
                labelBgColor='transparent'
                inputPaddingLeft="40xl"
                fontWeight='400'
                labelFontWeight='500'
                labelColor='white-200'
                labelMarginLeft="2xl"
                labelSize='10xl'
                fontSize='10xl'
                placeholderColor='black-100'
                squircle="10xl"
                width='1200px'
                colorScheme='lime-600'
                variant='filled'
                height='100px'
                textColor='black'
            />
        </div>
    );
}

export default TestInputs;